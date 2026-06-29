namespace TaskFlow.API.Models;

/// <summary>Request body for user registration.</summary>
public record RegisterRequest(string Email, string Password);

/// <summary>Request body for user login.</summary>
public record LoginRequest(string Email, string Password);

/// <summary>Request body for refreshing an access token.</summary>
public record RefreshRequest(string RefreshToken);

/// <summary>
/// Returned after successful login or token refresh.
/// AccessToken is short-lived (15 min); RefreshToken is long-lived (7 days) and rotated on each use.
/// </summary>
public record AuthResponse(string AccessToken, string RefreshToken, string Email, string Role, string Plan);
