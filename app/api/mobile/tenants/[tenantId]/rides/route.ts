import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string }>;

const RequestRideSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  requestedAt: z.coerce.date(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const snap = await adminDb
      .collection(`tenants/${tenantId}/rides`)
      .where('passengerIds', 'array-contains', residentId)
      .orderBy('requestedAt', 'desc')
      .limit(20)
      .get();

    const rides = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        destination: data.destination,
        status: data.status,
        requestedAt: data.requestedAt?.toDate?.(),
        driverId: data.driverId ?? null,
        vehicleId: data.vehicleId ?? null,
        notes: data.notes,
      };
    });

    return NextResponse.json({ rides });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const body = await request.json();
    const parsed = RequestRideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date();
    const docRef = adminDb.collection(`tenants/${tenantId}/rides`).doc();
    await docRef.set({
      tenantId,
      destination: parsed.data.destination,
      requestedAt: parsed.data.requestedAt,
      notes: parsed.data.notes ?? null,
      status: 'requested',
      passengerIds: [residentId],
      requestedBy: residentId,
      driverId: null,
      vehicleId: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ rideId: docRef.id }, { status: 201 });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
