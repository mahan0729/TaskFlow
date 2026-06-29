using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.Data;

namespace TaskFlow.API.Controllers;

/// <summary>
/// Admin-only endpoints for user management and platform statistics.
/// All routes require the "Admin" role claim in the JWT.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Returns platform-wide aggregate stats for the admin dashboard.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var stats = new AdminStatsResponse(
            TotalUsers: await db.Users.CountAsync(),
            FreeUsers: await db.Users.CountAsync(u => u.Plan == "Free"),
            ProUsers: await db.Users.CountAsync(u => u.Plan == "Pro"),
            TotalProjects: await db.Projects.CountAsync(),
            TotalTasks: await db.Tasks.CountAsync());

        return Ok(stats);
    }

    /// <summary>
    /// Returns a paginated list of all users with project and task counts.
    /// </summary>
    /// <param name="page">Page number (1-based). Defaults to 1.</param>
    /// <param name="pageSize">Results per page. Defaults to 20.</param>
    [HttpGet("users")]
    [ProducesResponseType(typeof(IEnumerable<AdminUserResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.Email,
                u.Role,
                u.Plan,
                u.Projects.Count,
                u.Projects.SelectMany(p => p.Tasks).Count(),
                u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Updates the role of a specific user.
    /// </summary>
    /// <param name="id">Target user's ID (PK).</param>
    /// <param name="request">New role — "User" or "Admin".</param>
    [HttpPut("users/{id:int}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRole([FromRoute] int id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Deletes a user and all their data (cascade).
    /// </summary>
    /// <param name="id">Target user's ID (PK).</param>
    [HttpDelete("users/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser([FromRoute] int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
