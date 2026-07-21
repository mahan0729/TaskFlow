using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.Data;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Services;

public class AuthService(AppDbContext db, TokenService tokenService, IEmailService emailService)
{
    private const int FreeTaskLimit = 10;

    public async Task<RegisterPendingResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email.ToLowerInvariant()))
            return null;

        var code = GenerateCode();
        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            VerificationCode = code,
            VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(30),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        await emailService.SendVerificationEmailAsync(user.Email, user.Email, code);

        return new RegisterPendingResponse(user.Email, "Check your email for a 6-digit verification code.");
    }

    /// <returns>Auth response, or null on bad credentials. NeedsVerification true when email not yet confirmed.</returns>
    public async Task<(AuthResponse? Auth, bool NeedsVerification)> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, false);

        if (!user.EmailVerified)
            return (null, true);

        return (await IssueTokensAsync(user), false);
    }

    public async Task<AuthResponse?> VerifyEmailAsync(VerifyEmailRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());

        if (user is null
            || user.VerificationCode != request.Code
            || user.VerificationCodeExpiry < DateTime.UtcNow)
            return null;

        user.EmailVerified = true;
        user.VerificationCode = null;
        user.VerificationCodeExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return await IssueTokensAsync(user);
    }

    public async Task ResendVerificationAsync(ResendVerificationRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());
        if (user is null || user.EmailVerified) return;

        var code = GenerateCode();
        user.VerificationCode = code;
        user.VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(30);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await emailService.SendVerificationEmailAsync(user.Email, user.FirstName ?? user.Email, code);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());
        if (user is null) return; // silent — don't reveal whether email exists

        var code = GenerateCode();
        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(30);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await emailService.SendPasswordResetEmailAsync(user.Email, user.FirstName ?? user.Email, code);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());

        if (user is null
            || user.PasswordResetCode != request.Code
            || user.PasswordResetCodeExpiry < DateTime.UtcNow)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return true;
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request)
    {
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken && !r.IsRevoked);

        if (stored is null || stored.ExpiresAt < DateTime.UtcNow)
            return null;

        stored.IsRevoked = true;
        await db.SaveChangesAsync();

        return await IssueTokensAsync(stored.User);
    }

    public async Task LogoutAsync(int userId)
    {
        var tokens = await db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
            token.IsRevoked = true;

        await db.SaveChangesAsync();
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return false;

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public int GetFreeTaskLimit() => FreeTaskLimit;

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var accessToken = tokenService.GenerateAccessToken(user);
        var refreshToken = tokenService.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = user.Id
        });

        await db.SaveChangesAsync();

        return new AuthResponse(accessToken, refreshToken, user.Email, user.Role, user.Plan, user.FirstName, user.LastName);
    }

    private static string GenerateCode() =>
        Random.Shared.Next(100000, 999999).ToString();
}
