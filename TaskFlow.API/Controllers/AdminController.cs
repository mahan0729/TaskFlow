using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;
using TaskFlow.API.Services;
using TaskFlow.Data;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Controllers;

/// <summary>
/// Admin-only endpoints for user management and platform statistics.
/// All routes require the "Admin" role claim in the JWT.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db, IEmailService email, IConfiguration config) : ControllerBase
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
    /// Creates a new user account from the admin panel.
    /// </summary>
    [HttpPost("users")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email is already in use." });

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Plan = "Free",
            EmailVerified = true, // admin-created accounts are pre-verified
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return StatusCode(201, new { id = user.Id });
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
                u.FirstName,
                u.LastName,
                u.Role,
                u.Plan,
                u.StripeCustomerId,
                u.StripeSubscriptionId,
                u.Projects.Count,
                u.Projects.SelectMany(p => p.Tasks).Count(),
                u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Updates a user's name fields.
    /// </summary>
    [HttpPut("users/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EditUser([FromRoute] int id, [FromBody] EditUserRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim();
        user.LastName  = string.IsNullOrWhiteSpace(request.LastName)  ? null : request.LastName.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
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
    /// Manually overrides a user's subscription plan.
    /// Use to comp a user on Pro or downgrade without going through Stripe.
    /// </summary>
    [HttpPut("users/{id:int}/plan")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePlan([FromRoute] int id, [FromBody] UpdateUserPlanRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.Plan = request.Plan;
        if (request.Plan == "Free")
            user.StripeSubscriptionId = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Returns all projects across all users, ordered by most recent first.
    /// </summary>
    [HttpGet("projects")]
    [ProducesResponseType(typeof(IEnumerable<AdminProjectResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await db.Projects
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new AdminProjectResponse(
                p.Id,
                p.Name,
                p.Description,
                p.Color,
                p.User.Email,
                p.User.FirstName,
                p.User.LastName,
                p.Tasks.Count,
                p.CreatedAt))
            .ToListAsync();

        return Ok(projects);
    }

    /// <summary>
    /// Sends a download email to an existing user by ID.
    /// </summary>
    [HttpPost("users/{id:int}/send-download")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendDownloadEmail([FromRoute] int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var windowsUrl = config["Downloads:WindowsUrl"] ?? "https://taskflowstorage.blob.core.windows.net/downloads/TaskFlow-Setup.exe";
        await email.SendDownloadEmailAsync(user.Email, user.FirstName ?? user.Email, windowsUrl);
        return NoContent();
    }

    /// <summary>
    /// Sends a download email to any email address — recipient does not need to be a user.
    /// </summary>
    [HttpPost("send-download")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SendDownloadEmailToAddress([FromBody] SendDownloadToEmailRequest request)
    {
        var windowsUrl = config["Downloads:WindowsUrl"] ?? "https://taskflowstorage.blob.core.windows.net/downloads/TaskFlow-Setup.exe";
        var name = string.IsNullOrWhiteSpace(request.Name) ? request.Email : request.Name;
        await email.SendDownloadEmailAsync(request.Email, name, windowsUrl);
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
