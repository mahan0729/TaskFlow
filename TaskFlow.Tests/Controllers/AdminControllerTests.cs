using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using TaskFlow.API.Controllers;
using TaskFlow.API.Models;
using TaskFlow.API.Services;
using TaskFlow.Data.Entities;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Controllers;

public class AdminControllerTests
{
    private static (AdminController controller, TaskFlow.Data.AppDbContext db) CreateController()
    {
        var db = DbFactory.CreateDb();
        var emailMock = new Mock<IEmailService>();
        emailMock.Setup(e => e.SendDownloadEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                 .Returns(Task.CompletedTask);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Downloads:WindowsUrl"] = "https://example.com/TaskFlow-Setup.exe",
            })
            .Build();

        return (new AdminController(db, emailMock.Object, config), db);
    }

    private static User MakeUser(string email, string role = "User", string plan = "Free") => new()
    {
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
        Role = role,
        Plan = plan,
        EmailVerified = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    // ── GetStats ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsCorrectCounts()
    {
        var (controller, db) = CreateController();
        db.Users.AddRange(MakeUser("a@x.com", plan: "Free"), MakeUser("b@x.com", plan: "Pro"));
        var project = new Project { Name = "P1", Color = "#000", User = db.Users.Local.First() };
        db.Projects.Add(project);
        db.Tasks.Add(new TaskItem { Title = "T1", ProjectId = project.Id, UserId = db.Users.Local.First().Id, Status = "Backlog" });
        await db.SaveChangesAsync();

        var result = await controller.GetStats();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var stats = ok.Value.Should().BeOfType<AdminStatsResponse>().Subject;
        stats.TotalUsers.Should().Be(2);
        stats.FreeUsers.Should().Be(1);
        stats.ProUsers.Should().Be(1);
        stats.TotalProjects.Should().Be(1);
        stats.TotalTasks.Should().Be(1);
    }

    // ── CreateUser ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateUser_NewEmail_Returns201AndCreatesUser()
    {
        var (controller, db) = CreateController();

        var result = await controller.CreateUser(new CreateUserRequest("new@x.com", "Password1!"));

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(201);
        db.Users.Should().HaveCount(1);
        db.Users.Single().Email.Should().Be("new@x.com");
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_Returns409()
    {
        var (controller, db) = CreateController();
        db.Users.Add(MakeUser("existing@x.com"));
        await db.SaveChangesAsync();

        var result = await controller.CreateUser(new CreateUserRequest("existing@x.com", "Password1!"));

        result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task CreateUser_EmailStoredAsLowercase()
    {
        var (controller, db) = CreateController();

        await controller.CreateUser(new CreateUserRequest("UPPER@X.COM", "Password1!"));

        db.Users.Single().Email.Should().Be("upper@x.com");
    }

    // ── EditUser ──────────────────────────────────────────────────────────

    [Fact]
    public async Task EditUser_Exists_UpdatesNameAndReturns204()
    {
        var (controller, db) = CreateController();
        var user = MakeUser("edit@x.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await controller.EditUser(user.Id, new EditUserRequest("Matt", "Mahan"));

        result.Should().BeOfType<NoContentResult>();
        db.Users.Single().FirstName.Should().Be("Matt");
        db.Users.Single().LastName.Should().Be("Mahan");
    }

    [Fact]
    public async Task EditUser_NotFound_Returns404()
    {
        var (controller, _) = CreateController();

        var result = await controller.EditUser(9999, new EditUserRequest("Matt", "Mahan"));

        result.Should().BeOfType<NotFoundResult>();
    }

    // ── DeleteUser ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteUser_Exists_Returns204AndRemovesUser()
    {
        var (controller, db) = CreateController();
        var user = MakeUser("delete@x.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await controller.DeleteUser(user.Id);

        result.Should().BeOfType<NoContentResult>();
        db.Users.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteUser_NotFound_Returns404()
    {
        var (controller, _) = CreateController();

        var result = await controller.DeleteUser(9999);

        result.Should().BeOfType<NotFoundResult>();
    }

    // ── UpdateRole ────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateRole_Exists_ChangesRoleAndReturns204()
    {
        var (controller, db) = CreateController();
        var user = MakeUser("role@x.com", role: "User");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await controller.UpdateRole(user.Id, new UpdateUserRoleRequest("Admin"));

        result.Should().BeOfType<NoContentResult>();
        db.Users.Single().Role.Should().Be("Admin");
    }

    // ── UpdatePlan ────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdatePlan_SetFree_ClearsStripeSubscriptionId()
    {
        var (controller, db) = CreateController();
        var user = MakeUser("plan@x.com", plan: "Pro");
        user.StripeSubscriptionId = "sub_test123";
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await controller.UpdatePlan(user.Id, new UpdateUserPlanRequest("Free"));

        result.Should().BeOfType<NoContentResult>();
        db.Users.Single().Plan.Should().Be("Free");
        db.Users.Single().StripeSubscriptionId.Should().BeNull();
    }
}
