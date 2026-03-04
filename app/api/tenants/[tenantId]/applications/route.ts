import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/features/auth/types/auth.types';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status'); // e.g. 'pending', 'assigned', 'accepted', 'rejected'
    const typeFilter = url.searchParams.get('type');     // e.g. 'bed', 'staff'

    let query = adminDb
      .collection('applications')
      .where('assignedTenantId', '==', tenantId) as FirebaseFirestore.Query;

    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    if (typeFilter) {
      query = query.where('type', '==', typeFilter);
    }

    query = query.orderBy('submittedAt', 'desc');

    const snap = await query.get();

    const applications = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        submittedAt: d.submittedAt?.toDate?.()?.toISOString() ?? d.submittedAt ?? null,
        assignedAt: d.assignedAt?.toDate?.()?.toISOString() ?? d.assignedAt ?? null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? d.updatedAt ?? null,
      };
    });

    return NextResponse.json({ applications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles: UserRole[] = ['tenant_admin', 'staff_admin', 'super_admin'];
    if (!allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, status, notes } = body as {
      applicationId: string;
      status: 'accepted' | 'rejected';
      notes?: string;
    };

    if (!applicationId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'applicationId and valid status required' }, { status: 400 });
    }

    // Verify the application belongs to this tenant
    const docRef = adminDb.collection('applications').doc(applicationId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    const data = snap.data()!;
    if (data.assignedTenantId !== tenantId) {
      return NextResponse.json({ error: 'Application not assigned to this tenant' }, { status: 403 });
    }

    await docRef.update({
      status,
      notes: notes ?? data.notes ?? '',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
