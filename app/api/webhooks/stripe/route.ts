// app/api/webhooks/stripe/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';


/**
 * Map Stripe subscription status to our internal status.
 */
function mapStripeStatus(status: string): 'active' | 'cancelled' | 'past_due' {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  return 'cancelled';
}

/**
 * Map a Stripe Price ID to our plan name by comparing against env vars.
 */
function planFromPriceId(priceId: string): 'free' | 'starter' | 'professional' | 'enterprise' {
  const starterMonthly = process.env.STRIPE_PRICE_STARTER_MONTHLY;
  const starterAnnual = process.env.STRIPE_PRICE_STARTER_ANNUAL;
  const proMonthly = process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY;
  const proAnnual = process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL;
  const enterpriseMonthly = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY;
  const enterpriseAnnual = process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL;

  if (priceId === starterMonthly || priceId === starterAnnual) return 'starter';
  if (priceId === proMonthly || priceId === proAnnual) return 'professional';
  if (priceId === enterpriseMonthly || priceId === enterpriseAnnual) return 'enterprise';

  // Default for unknown price IDs
  return 'starter';
}

/**
 * Update tenant subscription in Firestore from a Stripe Subscription object.
 */
async function updateTenantSubscription(
  tenantId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? '';
  const plan = planFromPriceId(priceId);
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = new Date(
    (subscription as unknown as { current_period_end: number }).current_period_end * 1000
  ).toISOString();

  await adminDb.collection('tenants').doc(tenantId).update({
    'subscription.plan': plan,
    'subscription.status': status,
    'subscription.currentPeriodEnd': currentPeriodEnd,
    'subscription.stripeSubscriptionId': subscription.id,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== 'subscription') break;

        const tenantId = session.metadata?.tenantId;
        if (!tenantId) {
          console.warn('checkout.session.completed: missing tenantId in metadata');
          break;
        }

        // Retrieve the full subscription to get current status + price
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await updateTenantSubscription(tenantId, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;

        if (!tenantId) {
          console.warn('customer.subscription.updated: missing tenantId in metadata');
          break;
        }

        await updateTenantSubscription(tenantId, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;

        if (!tenantId) {
          console.warn('customer.subscription.deleted: missing tenantId in metadata');
          break;
        }

        await adminDb.collection('tenants').doc(tenantId).update({
          'subscription.plan': 'free',
          'subscription.status': 'cancelled',
          'subscription.currentPeriodEnd': null,
          'subscription.stripeSubscriptionId': null,
        });
        break;
      }

      default:
        // Unhandled event type — not an error
        break;
    }
  } catch (error) {
    console.error(`Error processing Stripe event ${event.type}:`, error);
    return NextResponse.json({ error: 'Error processing webhook event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
