/**
 * BillingPage — shows the user's current plan and allows upgrading to Pro
 * via a Stripe Checkout session redirect.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, createCheckoutSession } from '../services/subscription.service';
import { Tooltip } from '../components/Tooltip';
import type { SubscriptionStatus } from '../types';

export default function BillingPage() {
  const { user } = useAuth();

  const [status, setStatus]       = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSubscriptionStatus();
        setStatus(data);
      } catch {
        setError('Failed to load billing info.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /** Redirects to Stripe Checkout for the Pro monthly plan */
  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const successUrl = `${window.location.origin}/billing?success=true`;
      const cancelUrl  = `${window.location.origin}/billing?cancelled=true`;
      const url = await createCheckoutSession(successUrl, cancelUrl);
      // Full-page redirect to Stripe hosted checkout
      window.location.href = url;
    } catch {
      setError('Could not start checkout. Please try again.');
      setUpgrading(false);
    }
  }

  // Show success / cancel messages from Stripe redirect query params
  const params  = new URLSearchParams(window.location.search);
  const success = params.get('success') === 'true';
  const cancelled = params.get('cancelled') === 'true';

  if (loading) return <p className="text-gray-500">Loading billing info…</p>;

  const isPro = status?.plan === 'Pro' || user?.plan === 'Pro';

  return (
    <div className="max-w-2xl space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your TaskFlow subscription.</p>
      </div>

      {/* Stripe redirect feedback banners */}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          🎉 You're now on Pro! Unlimited tasks are unlocked.
        </div>
      )}
      {cancelled && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Checkout was cancelled — your plan hasn't changed.
        </div>
      )}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Current plan card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          <span className={`badge text-sm ${isPro ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {/* Plan feature comparison */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free tier */}
          <div className={`rounded-lg border-2 p-4 ${!isPro ? 'border-primary-500' : 'border-gray-200'}`}>
            <p className="font-semibold text-gray-900">Free</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              <li>✓ Up to 10 tasks</li>
              <li>✓ Unlimited projects</li>
              <li>✓ All core features</li>
            </ul>
          </div>

          {/* Pro tier */}
          <div className={`rounded-lg border-2 p-4 ${isPro ? 'border-primary-500' : 'border-gray-200'}`}>
            <p className="font-semibold text-gray-900">Pro</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">$9<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              <li>✓ Unlimited tasks</li>
              <li>✓ Unlimited projects</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>

        {/* Upgrade / manage button */}
        {!isPro ? (
          <Tooltip text="You'll be securely redirected to Stripe to complete your upgrade" position="top">
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="btn-primary mt-6 w-full sm:w-auto"
            >
              {upgrading ? 'Redirecting to Stripe…' : 'Upgrade to Pro — $9/mo'}
            </button>
          </Tooltip>
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            To manage or cancel your subscription, contact support or use the Stripe customer portal.
          </p>
        )}
      </div>

      {/* Stripe customer ID for reference (useful for support) */}
      {status?.stripeCustomerId && (
        <Tooltip text="Reference this ID when contacting support about billing" position="top">
          <p className="text-xs text-gray-400 w-fit">
            Stripe customer: {status.stripeCustomerId}
          </p>
        </Tooltip>
      )}
    </div>
  );
}
