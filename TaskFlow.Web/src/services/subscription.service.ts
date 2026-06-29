/**
 * Subscription service — wraps the /api/subscription endpoints.
 */
import { api } from './api';
import type { SubscriptionStatus } from '../types';

/** Returns the current user's plan and Stripe identifiers */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get<SubscriptionStatus>('/api/subscription/status');
  return data;
}

/**
 * Creates a Stripe Checkout session and returns the redirect URL.
 * The caller should redirect window.location.href to the returned checkoutUrl.
 */
export async function createCheckoutSession(
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const { data } = await api.post<{ checkoutUrl: string }>('/api/subscription/checkout', {
    successUrl,
    cancelUrl,
  });
  return data.checkoutUrl;
}
