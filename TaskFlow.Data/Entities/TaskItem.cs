namespace TaskFlow.Data.Entities;

/// <summary>
/// An individual task within a project.
/// </summary>
public class TaskItem : BaseEntity
{
    /// <summary>FK to the parent project.</summary>
    public int ProjectId { get; set; }

    /// <summary>FK to the user who owns this task.</summary>
    public int UserId { get; set; }

    /// <summary>Short task title displayed in lists and cards.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Optional detailed description or notes.</summary>
    public string? Description { get; set; }

    /// <summary>Priority level: "Low", "Medium", or "High".</summary>
    public string Priority { get; set; } = "Medium";

    /// <summary>Workflow status: "Todo", "InProgress", or "Done".</summary>
    public string Status { get; set; } = "Todo";

    /// <summary>Optional due date (UTC).</summary>
    public DateTime? DueDate { get; set; }

    /// <summary>FK to the user this task is assigned to. Null = unassigned.</summary>
    public int? AssignedToUserId { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? AssignedTo { get; set; }
}
