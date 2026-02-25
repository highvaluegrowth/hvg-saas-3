import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb, FieldValue } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string; eventId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, eventId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const eventRef = adminDb.collection(`tenants/${tenantId}/events`).doc(eventId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await eventRef.update({ attendeeIds: FieldValue.arrayUnion(residentId) });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, eventId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const eventRef = adminDb.collection(`tenants/${tenantId}/events`).doc(eventId);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await eventRef.update({ attendeeIds: FieldValue.arrayRemove(residentId) });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
