import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { appUser } = await verifyResidentToken(request);

    if (!appUser.residentId) {
      return NextResponse.json({ enrollments: [] });
    }

    // Collection group query — finds enrollments across ALL tenants
    const snap = await adminDb
      .collectionGroup('enrollments')
      .where('residentId', '==', appUser.residentId)
      .get();

    const enrollments = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        tenantId: data.tenantId,
        status: data.status,
        houseId: data.houseId,
        phase: data.phase,
        moveInDate: data.moveInDate?.toDate?.() ?? null,
        moveOutDate: data.moveOutDate?.toDate?.() ?? null,
      };
    });

    return NextResponse.json({ enrollments });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
