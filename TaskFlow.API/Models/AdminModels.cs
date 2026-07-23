namespace TaskFlow.API.Models;

/// <summary>Summary of a single user shown in the admin user list.</summary>
public record AdminUserResponse(
    int Id,
    string Email,
    string? FirstName,
    string? LastName,
    string Role,
    string Plan,
    string? StripeCustomerId,
    string? StripeSubscriptionId,
    int ProjectCount,
    int TaskCount,
    DateTime CreatedAt);

/// <summary>Request body for an admin to create a new user.</summary>
public record CreateUserRequest(
    string Email,
    string Password,
    string Role = "User");

/// <summary>Request body for an admin to edit a user's name.</summary>
public record EditUserRequest(string? FirstName, string? LastName);

/// <summary>Request body for sending a download email to any email address.</summary>
public record SendDownloadToEmailRequest(string Email, string? Name);

/// <summary>Summary of a project shown in the admin projects list.</summary>
public record AdminProjectResponse(
    int Id,
    string Name,
    string? Description,
    string Color,
    string OwnerEmail,
    string? OwnerFirstName,
    string? OwnerLastName,
    int TaskCount,
    DateTime CreatedAt);

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
