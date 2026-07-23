using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TaskFlow.API.Services;
using TaskFlow.Data;

namespace TaskFlow.Tests.Helpers;

/// <summary>
/// Creates isolated test dependencies so each test class gets a clean slate.
/// </summary>
public static class DbFactory
{
    /// <summary>Creates a new in-memory AppDbContext with a unique database name.</summary>
    public static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    /// <summary>Creates a TokenService wired to a minimal in-memory configuration.</summary>
    public static TokenService CreateTokenService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"]   = "test-secret-key-at-least-32-characters-long!",
                ["Jwt:Issuer"]   = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
            })
            .Build();
        return new TokenService(config);
    }
}
