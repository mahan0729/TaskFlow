using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using TaskFlow.API.Models;
using TaskFlow.Data;

namespace TaskFlow.API.Services;

/// <summary>
/// Wraps Stripe Checkout and webhook handling for subscription management.
/// All Stripe calls use the secret key configured in appsettings / environment variables.
/// </summary>
public class StripeService(AppDbContext db, IConfiguration config)
{
    /// <summary>
    /// Creates a Stripe Checkout session for upgrading to Pro.
    /// If the user already has a Stripe customer record, it is reused.
    /// </summary>
    /// <param name="userId">Authenticated user's ID.</param>
    /// <param name="request">SuccessUrl and CancelUrl for post-checkout redirect.</param>
    /// <returns>The hosted Stripe Checkout URL to redirect the browser to.</returns>
    public async Task<CheckoutSessionResponse?> CreateCheckoutSessionAsync(int userId, CreateCheckoutSessionRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return null;

        // Reuse existing Stripe customer or create a new one
        var customerId = user.StripeCustomerId;
        if (customerId is null)
        {
            var customerService = new CustomerService();
            var customer = await customerService.CreateAsync(new CustomerCreateOptions { Email = user.Email });
            customerId = customer.Id;

            user.StripeCustomerId = customerId;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = userId;
            await db.SaveChangesAsync();
        }

        // Create a hosted checkout session for the Pro monthly price
        var sessionService = new SessionService();
        var session = await sessionService.CreateAsync(new SessionCreateOptions
        {
            Customer = customerId,
            Mode = "subscription",
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Price = config["Stripe:ProPriceId"],  // e.g. price_xxxxx from Stripe dashboard
                    Quantity = 1
                }
            ],
            SuccessUrl = request.SuccessUrl,
            CancelUrl = request.CancelUrl
        });

        return new CheckoutSessionResponse(session.Url);
    }

    /// <summary>
    /// Handles incoming Stripe webhook events.
    /// Verifies the webhook signature and updates the user's plan and subscription ID.
    /// </summary>
    /// <param name="json">Raw request body from Stripe.</param>
    /// <param name="stripeSignature">Value of the Stripe-Signature header.</param>
    public async Task HandleWebhookAsync(string json, string stripeSignature)
    {
        // Verify the event came from Stripe — rejects spoofed requests
        var webhookSecret = config["Stripe:WebhookSecret"]!;
        var stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);

        if (stripeEvent.Type == EventTypes.CustomerSubscriptionUpdated ||
            stripeEvent.Type == EventTypes.CustomerSubscriptionCreated)
        {
            var subscription = (Subscription)stripeEvent.Data.Object;
            await ActivateProAsync(subscription.CustomerId, subscription.Id);
        }
        else if (stripeEvent.Type == EventTypes.CustomerSubscriptionDeleted)
        {
            var subscription = (Subscription)stripeEvent.Data.Object;
            await DeactivateProAsync(subscription.CustomerId);
        }
    }

    // Sets user plan to "Pro" and stores the subscription ID
    private async Task ActivateProAsync(string customerId, string subscriptionId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.StripeCustomerId == customerId);
        if (user is null) return;

        user.Plan = "Pro";
        user.StripeSubscriptionId = subscriptionId;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    // Reverts user to Free plan when subscription is cancelled or payment fails
    private async Task DeactivateProAsync(string customerId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.StripeCustomerId == customerId);
        if (user is null) return;

        user.Plan = "Free";
        user.StripeSubscriptionId = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
}
