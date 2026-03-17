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

    const snap = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('contractTemplates')
      .get();

    const templates = snap.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || 'Untitled Template',
    }));

    // Add a default template if none exist
    if (templates.length === 0) {
        templates.push({ id: 'default', title: 'Resident Intake Agreement (System Default)' });
    }

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
