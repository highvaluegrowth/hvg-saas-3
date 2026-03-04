// app/api/tenants/[tenantId]/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { stripe } from '@/lib/stripe/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);

    const { tenantId } = await params;

    // Only tenant_admin or super_admin may initiate checkout
    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { priceId, interval } = (await request.json()) as {
      priceId: string;
      interval: 'month' | 'year';
    };

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // Fetch tenant document
    const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantSnap.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantData = tenantSnap.data() as Record<string, unknown>;

    // Get or create Stripe customer
    let stripeCustomerId = tenantData?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: (tenantData?.name as string) ?? tenantId,
        metadata: { tenantId },
      });
      stripeCustomerId = customer.id;

      await adminDb.collection('tenants').doc(tenantId).update({
        stripeCustomerId,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/${tenantId}/billing?success=true`,
      cancel_url: `${appUrl}/${tenantId}/billing?cancelled=true`,
      metadata: { tenantId },
      subscription_data: { metadata: { tenantId } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('POST /api/tenants/[tenantId]/billing/checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
