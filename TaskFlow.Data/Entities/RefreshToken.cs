namespace TaskFlow.Data.Entities;

/// <summary>
/// Stores JWT refresh tokens for sliding session support.
/// Tokens are invalidated on use (rotation) and on logout.
/// </summary>
public class RefreshToken : BaseEntity
{
    /// <summary>FK to the user this token belongs to.</summary>
    public int UserId { get; set; }

    /// <summary>Cryptographically random token string.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>UTC expiry — tokens older than this are invalid regardless of revocation status.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>True when the token has been used or explicitly revoked (logout).</summary>
    public bool IsRevoked { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}
