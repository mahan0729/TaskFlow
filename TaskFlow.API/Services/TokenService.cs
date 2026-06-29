using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Data.Entities;

namespace TaskFlow.API.Services;

/// <summary>
/// Generates and validates JWT access tokens and opaque refresh tokens.
/// </summary>
public class TokenService(IConfiguration config)
{
    /// <summary>
    /// Creates a signed JWT access token valid for 15 minutes.
    /// </summary>
    /// <param name="user">The authenticated user whose claims are embedded in the token.</param>
    /// <returns>Encoded JWT string.</returns>
    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("plan", user.Plan)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generates a cryptographically random opaque refresh token.
    /// Stored hashed in the database; the raw value is sent to the client.
    /// </summary>
    /// <returns>Base64Url-encoded 64-byte random token.</returns>
    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
