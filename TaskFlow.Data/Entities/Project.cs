namespace TaskFlow.Data.Entities;

/// <summary>
/// A logical grouping of tasks belonging to a user.
/// </summary>
public class Project : BaseEntity
{
    /// <summary>FK to the owning user.</summary>
    public int UserId { get; set; }

    /// <summary>Display name for the project.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional project description.</summary>
    public string? Description { get; set; }

    /// <summary>Hex color used for UI differentiation (e.g. "#6366f1").</summary>
    public string Color { get; set; } = "#6366f1";

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = [];
}
