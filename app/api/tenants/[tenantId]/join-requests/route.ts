import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const snap = await adminDb
      .collection(`tenants/${tenantId}/joinRequests`)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .get();

    const requests = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.() ?? null,
      desiredMoveInDate: doc.data().desiredMoveInDate?.toDate?.() ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
