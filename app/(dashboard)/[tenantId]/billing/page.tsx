'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { SubscriptionInfo } from '@/features/tenant/types/tenant.types';

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
  { id: 'free', name: 'Free', description: 'Get started with the essentials', monthlyPrice: 0, annualPrice: 0, features: ['Up to 10 residents', '1 house', 'Basic dashboard', 'HVG Companion AI (limited)'] },
  { id: 'starter', name: 'Starter', description: 'For growing recovery homes', monthlyPrice: 99, annualPrice: 990, features: ['Up to 50 residents', '3 houses', 'Full AI tools', 'LMS course builder', 'Application management'] },
  { id: 'professional', name: 'Professional', description: 'Scale your organization', monthlyPrice: 249, annualPrice: 2490, features: ['Unlimited residents', '10 houses', 'Marketing suite', 'Social media publishing', 'Priority support'], highlighted: true },
  { id: 'enterprise', name: 'Enterprise', description: 'For large networks', monthlyPrice: 599, annualPrice: 5990, features: ['Unlimited everything', 'Unlimited houses', 'White-label option', 'Dedicated support', 'Custom integrations'] },
];

const PLAN_ORDER: Record<string, number> = { free: 0, starter: 1, professional: 2, enterprise: 3 };

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: { monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '', annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ?? '' },
  professional: { monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '', annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? '' },
  enterprise: { monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '', annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL ?? '' },
};

function statusBadgeStyle(status?: string): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(52,211,153,0.15)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.3)' };
  if (status === 'past_due') return { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' };
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' };
}

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
      const res = await fetch(`/api/tenants/${tenantId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch tenant');
      const data = await res.json();
      setSubscription(data.tenant?.subscription ?? { plan: 'free', status: 'active' });
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setSubscription({ plan: 'free', status: 'active' });
    } finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const handleManageSubscription = async () => {
    setPortalLoading(true); setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/billing/portal`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to open portal');
      if (data.url) router.push(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setPortalLoading(false); }
  };

  const handleUpgrade = async (planId: string) => {
    const priceId = interval === 'annual' ? PRICE_IDS[planId]?.annual : PRICE_IDS[planId]?.monthly;
    if (!priceId) { setError('Price ID not configured. Please contact support or set NEXT_PUBLIC_STRIPE_PRICE_* env vars.'); return; }
    setCheckoutLoading(planId); setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, interval: interval === 'annual' ? 'year' : 'month' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout session');
      if (data.url) router.push(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setCheckoutLoading(null); }
  };

  const currentPlanOrder = PLAN_ORDER[subscription?.plan ?? 'free'] ?? 0;
  const upgradePlans = PLAN_DISPLAY.filter(p => PLAN_ORDER[p.id] > currentPlanOrder);

  const formatDate = (dateStr?: Date | string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Subscription</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Manage your plan and payment details.</p>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#6EE7B7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <p className="text-sm flex-1" style={{ color: '#A7F3D0' }}>Subscription updated successfully. Your new plan is now active.</p>
          <button onClick={() => setShowSuccess(false)} style={{ color: '#6EE7B7' }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* Cancelled Banner */}
      {showCancelled && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#FCD34D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" /></svg>
          <p className="text-sm flex-1" style={{ color: '#FDE68A' }}>Checkout was cancelled. No charges were made.</p>
          <button onClick={() => setShowCancelled(false)} style={{ color: '#FCD34D' }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#FCA5A5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" /></svg>
          <p className="text-sm flex-1" style={{ color: '#FECACA' }}>{error}</p>
          <button onClick={() => setError(null)} style={{ color: '#FCA5A5' }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* Current Plan */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-white capitalize">{subscription?.plan ?? 'Free'}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={statusBadgeStyle(subscription?.status)}>
              {subscription?.status ?? 'active'}
            </span>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            {subscription?.currentPeriodEnd && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Renews {formatDate(subscription.currentPeriodEnd)}</p>
            )}
            {subscription?.plan !== 'free' && (
              <button onClick={handleManageSubscription} disabled={portalLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {portalLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
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
            <h2 className="text-lg font-semibold text-white">Available Plans</h2>
            {/* Interval toggle */}
            <div className="flex items-center gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <button onClick={() => setIntervalMode('monthly')}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                style={interval === 'monthly' ? { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' } : { color: 'rgba(255,255,255,0.5)' }}>
                Monthly
              </button>
              <button onClick={() => setIntervalMode('annual')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                style={interval === 'annual' ? { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' } : { color: 'rgba(255,255,255,0.5)' }}>
                Annual
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(52,211,153,0.2)', color: '#6EE7B7' }}>Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upgradePlans.map(plan => {
              const isHighlighted = plan.highlighted;
              return (
                <div key={plan.id} className="relative rounded-2xl p-5 flex flex-col"
                  style={isHighlighted
                    ? { background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.4)', boxShadow: '0 0 30px rgba(8,145,178,0.12)' }
                    : cardStyle}>
                  {isHighlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-0.5 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
                      Most Popular
                    </span>
                  )}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{plan.description}</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      ${interval === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                    </span>
                    <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.45)' }}>/ mo</span>
                    {interval === 'annual' && plan.annualPrice > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Billed ${plan.annualPrice}/yr</p>
                    )}
                  </div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#34D399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleUpgrade(plan.id)} disabled={checkoutLoading === plan.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: isHighlighted ? 'linear-gradient(135deg,#0891B2,#059669)' : 'rgba(255,255,255,0.1)', border: isHighlighted ? 'none' : '1px solid rgba(255,255,255,0.15)' }}>
                    {checkoutLoading === plan.id && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Upgrade to {plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enterprise — highest tier */}
      {upgradePlans.length === 0 && subscription?.plan === 'enterprise' && (
        <div className="rounded-2xl p-6 text-center" style={cardStyle}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(52,211,153,0.15)' }}>
            <svg className="w-5 h-5" style={{ color: '#6EE7B7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            You are on the <strong className="text-white">Enterprise</strong> plan — the highest tier. Contact us for custom needs.
          </p>
        </div>
      )}
    </div>
  );
}
