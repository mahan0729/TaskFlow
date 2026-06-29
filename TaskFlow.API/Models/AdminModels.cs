namespace TaskFlow.API.Models;

/// <summary>Summary of a single user shown in the admin user list.</summary>
public record AdminUserResponse(
    int Id,
    string Email,
    string Role,
    string Plan,
    int ProjectCount,
    int TaskCount,
    DateTime CreatedAt);

/// <summary>Request body for an admin to change a user's role.</summary>
public record UpdateUserRoleRequest(
    /// <summary>Allowed values: "User", "Admin"</summary>
    string Role);

/// <summary>Platform-wide statistics shown on the admin dashboard.</summary>
public record AdminStatsResponse(
    int TotalUsers,
    int FreeUsers,
    int ProUsers,
    int TotalProjects,
    int TotalTasks);
