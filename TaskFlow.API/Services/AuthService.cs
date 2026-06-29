using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.Data;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Services;

/// <summary>
/// Handles user registration, login, token refresh, and logout.
/// </summary>
public class AuthService(AppDbContext db, TokenService tokenService)
{
    // Free plan task limit — Pro users have no limit
    private const int FreeTaskLimit = 10;

    /// <summary>
    /// Registers a new user with a BCrypt-hashed password.
    /// </summary>
    /// <param name="request">Email and plaintext password.</param>
    /// <returns>AuthResponse with tokens, or null if the email is already taken.</returns>
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        // Reject duplicate emails
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return null;

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return await IssueTokensAsync(user);
    }

    /// <summary>
    /// Validates credentials and returns tokens on success.
    /// </summary>
    /// <param name="request">Email and plaintext password.</param>
    /// <returns>AuthResponse, or null if credentials are invalid.</returns>
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return await IssueTokensAsync(user);
    }

    /// <summary>
    /// Rotates a refresh token: revokes the old one and issues a new pair.
    /// </summary>
    /// <param name="request">The client's current refresh token.</param>
    /// <returns>New AuthResponse, or null if the token is invalid or expired.</returns>
    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request)
    {
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken && !r.IsRevoked);

        if (stored is null || stored.ExpiresAt < DateTime.UtcNow)
            return null;

        // Revoke the used token (rotation — prevents replay attacks)
        stored.IsRevoked = true;
        await db.SaveChangesAsync();

        return await IssueTokensAsync(stored.User);
    }

    /// <summary>
    /// Revokes all refresh tokens for the user, effectively logging them out everywhere.
    /// </summary>
    /// <param name="userId">The authenticated user's ID from the JWT claim.</param>
    public async Task LogoutAsync(int userId)
    {
        var tokens = await db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
            token.IsRevoked = true;

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Returns the Free plan task limit for display on the frontend.
    /// </summary>
    public int GetFreeTaskLimit() => FreeTaskLimit;

    // Creates and persists a new refresh token, then returns the full auth response
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

        return new AuthResponse(accessToken, refreshToken, user.Email, user.Role, user.Plan);
    }
}
