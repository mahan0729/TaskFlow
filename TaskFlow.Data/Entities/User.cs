namespace TaskFlow.Data.Entities;

/// <summary>
/// Represents a registered user of TaskFlow.
/// </summary>
public class User : BaseEntity
{
    /// <summary>Unique email address used for login.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>BCrypt hashed password. Never store plaintext.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Role: "User" or "Admin".</summary>
    public string Role { get; set; } = "User";

    /// <summary>Subscription plan: "Free" or "Pro".</summary>
    public string Plan { get; set; } = "Free";

    /// <summary>Stripe customer ID for billing (e.g. cus_xxxxx).</summary>
    public string? StripeCustomerId { get; set; }

    /// <summary>Active Stripe subscription ID (e.g. sub_xxxxx). Null if on Free plan.</summary>
    public string? StripeSubscriptionId { get; set; }

    // Navigation properties
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
