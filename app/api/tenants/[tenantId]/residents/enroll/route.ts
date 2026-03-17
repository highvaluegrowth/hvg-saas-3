import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb, FieldValue } from '@/lib/firebase/admin';
import { canWrite } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canWrite(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Double check user exists
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const nowTime = new Date();
    const isoNow = nowTime.toISOString();
    const batch = adminDb.batch();

    // 1. Create Enrollment Document
    const enrollmentRef = adminDb.collection(`tenants/${tenantId}/enrollments`).doc(userId);
    batch.set(enrollmentRef, {
        residentId: userId,
        tenantId,
        status: 'active',
        phase: 1,
        sobrietyStartDate: null,
        moveInDate: nowTime,
        moveOutDate: null,
        createdAt: nowTime,
        updatedAt: nowTime,
    });

    // 2. Update Global User
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, {
        role: 'resident',
        residentId: userId, // Keep synchronized
        tenantIds: FieldValue.arrayUnion(tenantId),
        updatedAt: isoNow,
    });

    await batch.commit();

    return NextResponse.json({ success: true, resident: { id: userId } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
