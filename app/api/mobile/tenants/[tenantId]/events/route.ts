import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;
    await verifyResidentTenantAccess(request, tenantId);

    const now = new Date();
    const snap = await adminDb
      .collection(`tenants/${tenantId}/events`)
      .where('scheduledAt', '>=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(50)
      .get();

    const events = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt?.toDate?.(),
        duration: data.duration,
        location: data.location,
        type: data.type,
        attendeeCount: (data.attendeeIds ?? []).length,
      };
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
