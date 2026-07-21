namespace TaskFlow.API.Models;

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record UpdateProfileRequest(string FirstName, string LastName);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record RegisterPendingResponse(string Email, string Message);
public record VerifyEmailRequest(string Email, string Code);
public record ResendVerificationRequest(string Email);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);

/// <summary>
/// Returned after successful login, token refresh, or email verification.
/// AccessToken is short-lived (15 min); RefreshToken is long-lived (7 days) and rotated on each use.
/// </summary>
public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    string Email,
    string Role,
    string Plan,
    string? FirstName,
    string? LastName);
