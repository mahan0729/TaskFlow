using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.Data;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Controllers;

/// <summary>
/// CRUD operations for tasks. All endpoints require authentication.
/// Free plan users are limited to 10 tasks total.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController(AppDbContext db) : ControllerBase
{
    // Free plan task cap — matches the constant in AuthService
    private const int FreeTaskLimit = 10;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentUserPlan => User.FindFirstValue("plan") ?? "Free";

    /// <summary>
    /// Returns tasks for the authenticated user with optional filtering.
    /// </summary>
    /// <param name="filter">Optional query params: projectId, status, priority.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TaskResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] TaskFilterParams filter)
    {
        var query = db.Tasks
            .Include(t => t.Project)
            .Where(t => t.UserId == CurrentUserId);

        // Apply optional filters
        if (filter.ProjectId.HasValue)
            query = query.Where(t => t.ProjectId == filter.ProjectId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Status))
            query = query.Where(t => t.Status == filter.Status);

        if (!string.IsNullOrWhiteSpace(filter.Priority))
            query = query.Where(t => t.Priority == filter.Priority);

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => MapToResponse(t))
            .ToListAsync();

        return Ok(tasks);
    }

    /// <summary>
    /// Returns a single task by ID.
    /// </summary>
    /// <param name="id">Task ID (PK).</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var task = await db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);

        return task is null ? NotFound() : Ok(MapToResponse(task));
    }

    /// <summary>
    /// Creates a new task. Free plan users are blocked at 10 tasks.
    /// </summary>
    /// <param name="request">Task details including projectId, title, priority, status, and optional dueDate.</param>
    [HttpPost]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        // Enforce Free plan task limit
        if (CurrentUserPlan == "Free")
        {
            var taskCount = await db.Tasks.CountAsync(t => t.UserId == CurrentUserId);
            if (taskCount >= FreeTaskLimit)
                return StatusCode(402, new { message = $"Free plan is limited to {FreeTaskLimit} tasks. Upgrade to Pro for unlimited tasks." });
        }

        // Verify the project belongs to this user
        var projectExists = await db.Projects.AnyAsync(p => p.Id == request.ProjectId && p.UserId == CurrentUserId);
        if (!projectExists) return NotFound(new { message = "Project not found." });

        var task = new TaskItem
        {
            ProjectId = request.ProjectId,
            UserId = CurrentUserId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Status = request.Status,
            DueDate = request.DueDate,
            CreatedBy = CurrentUserId,
            UpdatedBy = CurrentUserId
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Reload with navigation for the response
        await db.Entry(task).Reference(t => t.Project).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, MapToResponse(task));
    }

    /// <summary>
    /// Updates an existing task's fields.
    /// </summary>
    /// <param name="id">Task ID (PK).</param>
    /// <param name="request">Updated task fields.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateTaskRequest request)
    {
        var task = await db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);

        if (task is null) return NotFound();

        // Validate the target project belongs to this user if it changed
        if (task.ProjectId != request.ProjectId)
        {
            var projectExists = await db.Projects.AnyAsync(p => p.Id == request.ProjectId && p.UserId == CurrentUserId);
            if (!projectExists) return NotFound(new { message = "Project not found." });

            task.ProjectId = request.ProjectId;
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = request.Priority;
        task.Status = request.Status;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = CurrentUserId;

        await db.SaveChangesAsync();

        // Reload project name if it changed
        await db.Entry(task).Reference(t => t.Project).LoadAsync();

        return Ok(MapToResponse(task));
    }

    /// <summary>
    /// Deletes a task by ID.
    /// </summary>
    /// <param name="id">Task ID (PK).</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);
        if (task is null) return NotFound();

        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Maps the EF entity to the API response record
    private static TaskResponse MapToResponse(TaskItem t) =>
        new(t.Id, t.ProjectId, t.Project?.Name ?? "", t.Title, t.Description,
            t.Priority, t.Status, t.DueDate, t.CreatedAt, t.UpdatedAt);
}
