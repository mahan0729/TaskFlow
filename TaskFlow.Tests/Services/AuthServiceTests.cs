using FluentAssertions;
using Moq;
using TaskFlow.API.Models;
using TaskFlow.API.Services;
using TaskFlow.Data.Entities;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Services;

public class AuthServiceTests
{
    private static AuthService CreateService(out TaskFlow.Data.AppDbContext db)
    {
        db = DbFactory.CreateDb();
        var tokenService = DbFactory.CreateTokenService();
        var emailMock = new Mock<IEmailService>();
        emailMock.Setup(e => e.SendVerificationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                 .Returns(Task.CompletedTask);
        emailMock.Setup(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                 .Returns(Task.CompletedTask);
        return new AuthService(db, tokenService, emailMock.Object);
    }

    // ── Register ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_NewEmail_CreatesUserAndReturnsResponse()
    {
        var svc = CreateService(out var db);

        var result = await svc.RegisterAsync(new RegisterRequest("test@example.com", "Password1!"));

        result.Should().NotBeNull();
        result!.Email.Should().Be("test@example.com");
        db.Users.Should().HaveCount(1);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsNull()
    {
        var svc = CreateService(out _);
        await svc.RegisterAsync(new RegisterRequest("dupe@example.com", "Password1!"));

        var result = await svc.RegisterAsync(new RegisterRequest("dupe@example.com", "Password1!"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task Register_EmailStoredAsLowercase()
    {
        var svc = CreateService(out var db);

        await svc.RegisterAsync(new RegisterRequest("UPPER@Example.COM", "Password1!"));

        db.Users.Single().Email.Should().Be("upper@example.com");
    }

    // ── Login ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WrongPassword_ReturnsNullWithoutVerificationFlag()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "user@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            EmailVerified = true,
        });
        await db.SaveChangesAsync();

        var (auth, needsVerification) = await svc.LoginAsync(new LoginRequest("user@example.com", "WrongPassword"));

        auth.Should().BeNull();
        needsVerification.Should().BeFalse();
    }

    [Fact]
    public async Task Login_UnverifiedEmail_ReturnsNeedsVerification()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "unverified@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            EmailVerified = false,
        });
        await db.SaveChangesAsync();

        var (auth, needsVerification) = await svc.LoginAsync(new LoginRequest("unverified@example.com", "Password1!"));

        auth.Should().BeNull();
        needsVerification.Should().BeTrue();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsAuthResponse()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "valid@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            EmailVerified = true,
        });
        await db.SaveChangesAsync();

        var (auth, needsVerification) = await svc.LoginAsync(new LoginRequest("valid@example.com", "Password1!"));

        auth.Should().NotBeNull();
        auth!.Email.Should().Be("valid@example.com");
        needsVerification.Should().BeFalse();
    }

    // ── VerifyEmail ───────────────────────────────────────────────────────

    [Fact]
    public async Task VerifyEmail_ValidCode_SetsEmailVerifiedAndReturnsAuth()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "verify@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            VerificationCode = "123456",
            VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(30),
        });
        await db.SaveChangesAsync();

        var result = await svc.VerifyEmailAsync(new VerifyEmailRequest("verify@example.com", "123456"));

        result.Should().NotBeNull();
        db.Users.Single().EmailVerified.Should().BeTrue();
        db.Users.Single().VerificationCode.Should().BeNull();
    }

    [Fact]
    public async Task VerifyEmail_ExpiredCode_ReturnsNull()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "expired@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            VerificationCode = "123456",
            VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(-1), // already expired
        });
        await db.SaveChangesAsync();

        var result = await svc.VerifyEmailAsync(new VerifyEmailRequest("expired@example.com", "123456"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task VerifyEmail_WrongCode_ReturnsNull()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "wrongcode@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            VerificationCode = "123456",
            VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(30),
        });
        await db.SaveChangesAsync();

        var result = await svc.VerifyEmailAsync(new VerifyEmailRequest("wrongcode@example.com", "999999"));

        result.Should().BeNull();
    }

    // ── ResetPassword ─────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_ValidCode_UpdatesPasswordHash()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "reset@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword"),
            PasswordResetCode = "654321",
            PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(30),
        });
        await db.SaveChangesAsync();

        var success = await svc.ResetPasswordAsync(new ResetPasswordRequest("reset@example.com", "654321", "NewPassword1!"));

        success.Should().BeTrue();
        BCrypt.Net.BCrypt.Verify("NewPassword1!", db.Users.Single().PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ResetPassword_InvalidCode_ReturnsFalse()
    {
        var svc = CreateService(out var db);
        db.Users.Add(new User
        {
            Email = "reset2@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword"),
            PasswordResetCode = "654321",
            PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(30),
        });
        await db.SaveChangesAsync();

        var success = await svc.ResetPasswordAsync(new ResetPasswordRequest("reset2@example.com", "000000", "NewPassword1!"));

        success.Should().BeFalse();
    }

    // ── ChangePassword ────────────────────────────────────────────────────

    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_ReturnsFalse()
    {
        var svc = CreateService(out var db);
        var user = new User
        {
            Email = "change@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Current1!"),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var success = await svc.ChangePasswordAsync(user.Id, new ChangePasswordRequest("Wrong!", "New1!"));

        success.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePassword_CorrectCurrentPassword_UpdatesHash()
    {
        var svc = CreateService(out var db);
        var user = new User
        {
            Email = "change2@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Current1!"),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var success = await svc.ChangePasswordAsync(user.Id, new ChangePasswordRequest("Current1!", "NewPass1!"));

        success.Should().BeTrue();
        BCrypt.Net.BCrypt.Verify("NewPass1!", db.Users.Single().PasswordHash).Should().BeTrue();
    }
}
