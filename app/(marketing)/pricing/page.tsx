'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

// Plan data defined inline — avoids importing server-side env vars in a client component
interface PricingPlan {
  id: 'free' | 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlighted?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the essentials',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 10 residents',
      '1 house',
      'Basic dashboard',
      'HVG Companion AI (limited)',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing recovery homes',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Up to 50 residents',
      '3 houses',
      'Full AI tools',
      'LMS course builder',
      'Application management',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Scale your organization',
    monthlyPrice: 249,
    annualPrice: 2490,
    features: [
      'Unlimited residents',
      '10 houses',
      'Marketing suite',
      'Social media publishing',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large networks',
    monthlyPrice: 599,
    annualPrice: 5990,
    features: [
      'Unlimited everything',
      'Unlimited houses',
      'White-label option',
      'Dedicated support',
      'Custom integrations',
    ],
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <>
      <MarketingNavbar />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-20 pb-10 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Choose the plan that fits your recovery home network. Upgrade or downgrade anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </section>

        {/* Plan Cards */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const price =
                billingInterval === 'annual'
                  ? plan.annualPrice === 0
                    ? 0
                    : Math.round(plan.annualPrice / 12)
                  : plan.monthlyPrice;

              const isFree = plan.id === 'free';
              const href = isFree ? '/register' : `/register?plan=${plan.id}`;
              const ctaLabel = isFree ? 'Get Started' : 'Start Free Trial';

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                    plan.highlighted
                      ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ${price}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-gray-400 text-sm mb-1">/mo</span>
                      )}
                    </div>
                    {plan.monthlyPrice === 0 && (
                      <p className="text-sm text-gray-400 mt-0.5">Free forever</p>
                    )}
                    {billingInterval === 'annual' && plan.annualPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Billed ${plan.annualPrice.toLocaleString()}/yr
                      </p>
                    )}
                    {billingInterval === 'monthly' && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        or ${plan.annualPrice.toLocaleString()}/yr with annual billing
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-7">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    className={`block text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isFree
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-400 mt-10">
            All plans include a 14-day free trial. No credit card required to get started.
            Cancel anytime.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
