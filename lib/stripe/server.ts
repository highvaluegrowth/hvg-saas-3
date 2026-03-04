// lib/stripe/server.ts
// Lazy initialization — Stripe is only instantiated at request time,
// never during Next.js build-time page data collection.
import type Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeClass = require('stripe').default ?? require('stripe');
    _stripe = new StripeClass(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe!;
}

// Backward-compatible proxy so existing code using `stripe.xxx` still works
export const stripe: Stripe = new Proxy({} as Stripe, {
  get: (_, prop) => {
    return getStripe()[prop as keyof Stripe];
  },
});
