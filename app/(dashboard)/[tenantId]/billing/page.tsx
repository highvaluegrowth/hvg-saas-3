'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { SubscriptionInfo } from '@/features/tenant/types/tenant.types';

// Plan display data — defined inline so this client component has no server env var deps
interface PlanDisplay {
  id: 'free' | 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlighted?: boolean;
}

const PLAN_DISPLAY: PlanDisplay[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the essentials',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['Up to 10 residents', '1 house', 'Basic dashboard', 'HVG Companion AI (limited)'],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing recovery homes',
    monthlyPrice: 99,
    annualPrice: 990,
    features: ['Up to 50 residents', '3 houses', 'Full AI tools', 'LMS course builder', 'Application management'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Scale your organization',
    monthlyPrice: 249,
    annualPrice: 2490,
    features: ['Unlimited residents', '10 houses', 'Marketing suite', 'Social media publishing', 'Priority support'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large networks',
    monthlyPrice: 599,
    annualPrice: 5990,
    features: ['Unlimited everything', 'Unlimited houses', 'White-label option', 'Dedicated support', 'Custom integrations'],
  },
];

const PLAN_ORDER: Record<string, number> = { free: 0, starter: 1, professional: 2, enterprise: 3 };

// Stripe Price ID env vars are not available client-side, so we pass a plan identifier
// and the API resolves the Stripe price ID server-side via env vars.
// Instead we store price IDs in data attributes exposed via NEXT_PUBLIC_ vars.
const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '',
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ?? '',
  },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '',
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? '',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL ?? '',
  },
};

export default function BillingPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const successParam = searchParams.get('success');
  const cancelledParam = searchParams.get('cancelled');

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [interval, setIntervalMode] = useState<'monthly' | 'annual'>('monthly');
  const [showSuccess, setShowSuccess] = useState(successParam === 'true');
  const [showCancelled, setShowCancelled] = useState(cancelledParam === 'true');
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tenant');
      const data = await res.json();
      setSubscription(data.tenant?.subscription ?? { plan: 'free', status: 'active' });
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setSubscription({ plan: 'free', status: 'active' });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to open portal');
      if (data.url) router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    const stripeInterval = interval === 'annual' ? 'year' : 'month';
    const priceId =
      interval === 'annual' ? PRICE_IDS[planId]?.annual : PRICE_IDS[planId]?.monthly;

    if (!priceId) {
      setError(
        'Price ID not configured. Please contact support or set NEXT_PUBLIC_STRIPE_PRICE_* env vars.'
      );
      return;
    }

    setCheckoutLoading(planId);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/billing/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, interval: stripeInterval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout session');
      if (data.url) router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlanOrder = PLAN_ORDER[subscription?.plan ?? 'free'] ?? 0;
  const upgradePlans = PLAN_DISPLAY.filter((p) => PLAN_ORDER[p.id] > currentPlanOrder);

  const formatDate = (dateStr?: Date | string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColor = (status?: string) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'past_due') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and payment details.</p>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-800 text-sm flex-1">
            Subscription updated successfully. Your new plan is now active.
          </p>
          <button onClick={() => setShowSuccess(false)} className="text-green-600 hover:text-green-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Cancelled Banner */}
      {showCancelled && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
          <p className="text-yellow-800 text-sm flex-1">
            Checkout was cancelled. No charges were made.
          </p>
          <button onClick={() => setShowCancelled(false)} className="text-yellow-600 hover:text-yellow-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-gray-900 capitalize">
              {subscription?.plan ?? 'Free'}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(
                subscription?.status
              )}`}
            >
              {subscription?.status ?? 'active'}
            </span>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-gray-500">
                Renews {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {subscription?.plan !== 'free' && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {portalLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      {upgradePlans.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
            {/* Billing interval toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setIntervalMode('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  interval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIntervalMode('annual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  interval === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upgradePlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border p-5 shadow-sm flex flex-col ${
                  plan.highlighted
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full shadow">
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    $
                    {interval === 'annual'
                      ? Math.round(plan.annualPrice / 12)
                      : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 text-sm">/mo</span>
                  {interval === 'annual' && plan.annualPrice > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Billed ${plan.annualPrice}/yr
                    </p>
                  )}
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {checkoutLoading === plan.id ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Upgrade to {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already on highest plan */}
      {upgradePlans.length === 0 && subscription?.plan === 'enterprise' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600 text-sm">
            You are on the Enterprise plan — the highest tier. Contact us for custom needs.
          </p>
        </div>
      )}
    </div>
  );
}
