import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb, FieldValue } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string; eventId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, eventId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);
    
    const body = await request.json();
    const { pin } = body;

    if (!pin || pin.length !== 4) {
        return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
    }

    const eventRef = adminDb.collection(`tenants/${tenantId}/events`).doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data()!;
    
    if (eventData.requireVerification) {
        if (eventData.verificationPin !== pin) {
            return NextResponse.json({ error: 'Incorrect verification code' }, { status: 403 });
        }
    }

    // Log attendance
    await eventRef.update({ 
        attendeeIds: FieldValue.arrayUnion(residentId),
        updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
