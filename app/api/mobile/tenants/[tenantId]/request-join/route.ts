import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string }>;

const JoinRequestSchema = z.object({
  message: z.string().optional(),
  desiredMoveInDate: z.coerce.date().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;
    const { uid, appUser } = await verifyResidentToken(request);

    const body = await request.json();
    const parsed = JoinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Check tenant exists
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Idempotent: one join request per user per tenant (doc ID = uid)
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('joinRequests')
      .doc(uid)
      .set({
        uid,
        email: appUser.email,
        displayName: appUser.displayName,
        residentId: appUser.residentId ?? null,
        message: parsed.data.message ?? null,
        desiredMoveInDate: parsed.data.desiredMoveInDate ?? null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
