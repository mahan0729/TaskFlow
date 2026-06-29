using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.API.Models;
using TaskFlow.API.Services;
using TaskFlow.Data;

namespace TaskFlow.API.Controllers;

/// <summary>
/// Manages Stripe subscription lifecycle: checkout, status, and webhooks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SubscriptionController(StripeService stripeService, AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Creates a Stripe Checkout session and returns the redirect URL.
    /// The browser should redirect to CheckoutUrl to complete payment.
    /// </summary>
    /// <param name="request">SuccessUrl and CancelUrl for post-checkout redirect.</param>
    [HttpPost("checkout")]
    [Authorize]
    [ProducesResponseType(typeof(CheckoutSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutSessionRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await stripeService.CreateCheckoutSessionAsync(userId, request);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Returns the current user's plan and Stripe identifiers for the billing page.
    /// </summary>
    [HttpGet("status")]
    [Authorize]
    [ProducesResponseType(typeof(SubscriptionStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        return Ok(new SubscriptionStatusResponse(user.Plan, user.StripeSubscriptionId, user.StripeCustomerId));
    }

    /// <summary>
    /// Stripe webhook endpoint. Must be excluded from JWT auth — Stripe signs requests with HMAC-SHA256.
    /// Configure this URL in the Stripe dashboard: https://yourdomain/api/subscription/webhook
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Webhook()
    {
        // Read the raw body — must not be deserialized before signature verification
        using var reader = new StreamReader(Request.Body);
        var json = await reader.ReadToEndAsync();

        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();
        if (signature is null) return BadRequest();

        try
        {
            await stripeService.HandleWebhookAsync(json, signature);
            return Ok();
        }
        catch (Stripe.StripeException)
        {
            // Signature verification failed — not a legitimate Stripe event
            return BadRequest();
        }
    }
}
