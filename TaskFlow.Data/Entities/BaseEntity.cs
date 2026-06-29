namespace TaskFlow.Data.Entities;

/// <summary>
/// Base class for all entities. Provides PK and audit fields.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>UTC timestamp when the record was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UserId of the user who created this record. Null for system-generated records.</summary>
    public int? CreatedBy { get; set; }

    /// <summary>UTC timestamp of the last update.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UserId of the user who last updated this record.</summary>
    public int? UpdatedBy { get; set; }
}
