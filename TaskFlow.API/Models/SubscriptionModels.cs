namespace TaskFlow.API.Models;

/// <summary>
/// Request to create a Stripe Checkout session for upgrading to Pro.
/// SuccessUrl and CancelUrl tell Stripe where to redirect after checkout.
/// </summary>
public record CreateCheckoutSessionRequest(
    /// <summary>URL Stripe redirects to on successful payment (e.g. https://taskflow.app/billing/success).</summary>
    string SuccessUrl,
    /// <summary>URL Stripe redirects to if the user cancels checkout.</summary>
    string CancelUrl);

/// <summary>Response containing the Stripe hosted checkout URL to redirect the user to.</summary>
public record CheckoutSessionResponse(string CheckoutUrl);

/// <summary>Current subscription status returned to the billing page.</summary>
public record SubscriptionStatusResponse(
    string Plan,
    string? StripeSubscriptionId,
    string? StripeCustomerId);
