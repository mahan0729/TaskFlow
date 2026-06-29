namespace TaskFlow.API.Models;

/// <summary>Request body for creating a new task.</summary>
public record CreateTaskRequest(
    int ProjectId,
    string Title,
    string? Description,
    /// <summary>Allowed values: "Low", "Medium", "High"</summary>
    string Priority = "Medium",
    /// <summary>Allowed values: "Todo", "InProgress", "Done"</summary>
    string Status = "Todo",
    DateTime? DueDate = null);

/// <summary>Request body for updating an existing task.</summary>
public record UpdateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    string Status,
    int ProjectId,
    DateTime? DueDate);

/// <summary>Task data returned to the client.</summary>
public record TaskResponse(
    int Id,
    int ProjectId,
    string ProjectName,
    string Title,
    string? Description,
    string Priority,
    string Status,
    DateTime? DueDate,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Query parameters for filtering the task list.</summary>
public record TaskFilterParams(
    /// <summary>Filter by project ID. Null returns all projects.</summary>
    int? ProjectId = null,
    /// <summary>Filter by status. Null returns all statuses.</summary>
    string? Status = null,
    /// <summary>Filter by priority. Null returns all priorities.</summary>
    string? Priority = null);
