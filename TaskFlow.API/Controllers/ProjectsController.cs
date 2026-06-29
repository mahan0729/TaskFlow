using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.Data;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Controllers;

/// <summary>
/// CRUD operations for projects. All endpoints require authentication.
/// Users can only access their own projects.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    // Extracts the authenticated user's ID from the JWT claim
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Returns all projects for the authenticated user, with task counts.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProjectResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var projects = await db.Projects
            .Where(p => p.UserId == CurrentUserId)
            .Select(p => new ProjectResponse(
                p.Id,
                p.Name,
                p.Description,
                p.Color,
                p.Tasks.Count,
                p.CreatedAt))
            .ToListAsync();

        return Ok(projects);
    }

    /// <summary>
    /// Returns a single project by ID. Returns 404 if not found or not owned by the current user.
    /// </summary>
    /// <param name="id">Project ID (PK).</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var project = await db.Projects
            .Where(p => p.Id == id && p.UserId == CurrentUserId)
            .Select(p => new ProjectResponse(p.Id, p.Name, p.Description, p.Color, p.Tasks.Count, p.CreatedAt))
            .FirstOrDefaultAsync();

        return project is null ? NotFound() : Ok(project);
    }

    /// <summary>
    /// Creates a new project for the authenticated user.
    /// </summary>
    /// <param name="request">Name, optional description, and hex color.</param>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var project = new Project
        {
            UserId = CurrentUserId,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            CreatedBy = CurrentUserId,
            UpdatedBy = CurrentUserId
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync();

        var response = new ProjectResponse(project.Id, project.Name, project.Description, project.Color, 0, project.CreatedAt);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, response);
    }

    /// <summary>
    /// Updates a project's name, description, or color.
    /// </summary>
    /// <param name="id">Project ID (PK).</param>
    /// <param name="request">Updated fields.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateProjectRequest request)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == CurrentUserId);
        if (project is null) return NotFound();

        project.Name = request.Name;
        project.Description = request.Description;
        project.Color = request.Color;
        project.UpdatedAt = DateTime.UtcNow;
        project.UpdatedBy = CurrentUserId;

        await db.SaveChangesAsync();

        var taskCount = await db.Tasks.CountAsync(t => t.ProjectId == id);
        return Ok(new ProjectResponse(project.Id, project.Name, project.Description, project.Color, taskCount, project.CreatedAt));
    }

    /// <summary>
    /// Deletes a project and all its tasks (cascade).
    /// </summary>
    /// <param name="id">Project ID (PK).</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == CurrentUserId);
        if (project is null) return NotFound();

        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
