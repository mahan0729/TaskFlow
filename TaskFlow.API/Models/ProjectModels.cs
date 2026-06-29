namespace TaskFlow.API.Models;

/// <summary>Request body for creating a new project.</summary>
public record CreateProjectRequest(string Name, string? Description, string Color = "#6366f1");

/// <summary>Request body for updating an existing project.</summary>
public record UpdateProjectRequest(string Name, string? Description, string Color);

/// <summary>Project data returned to the client.</summary>
public record ProjectResponse(int Id, string Name, string? Description, string Color, int TaskCount, DateTime CreatedAt);
