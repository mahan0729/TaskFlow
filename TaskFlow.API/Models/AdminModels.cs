namespace TaskFlow.API.Models;

/// <summary>Summary of a single user shown in the admin user list.</summary>
public record AdminUserResponse(
    int Id,
    string Email,
    string Role,
    string Plan,
    string? StripeCustomerId,
    string? StripeSubscriptionId,
    int ProjectCount,
    int TaskCount,
    DateTime CreatedAt);

/// <summary>Request body for an admin to create a new user.</summary>
public record CreateUserRequest(
    /// <summary>Email address for the new account.</summary>
    string Email,
    /// <summary>Initial plaintext password (hashed before storage).</summary>
    string Password,
    /// <summary>Allowed values: "User", "Admin". Defaults to "User".</summary>
    string Role = "User");

/// <summary>Request body for an admin to change a user's role.</summary>
public record UpdateUserRoleRequest(
    /// <summary>Allowed values: "User", "Admin"</summary>
    string Role);

/// <summary>Request body for an admin to manually override a user's plan.</summary>
public record UpdateUserPlanRequest(
    /// <summary>Allowed values: "Free", "Pro"</summary>
    string Plan);

/// <summary>Platform-wide statistics shown on the admin dashboard.</summary>
public record AdminStatsResponse(
    int TotalUsers,
    int FreeUsers,
    int ProUsers,
    int TotalProjects,
    int TotalTasks);
