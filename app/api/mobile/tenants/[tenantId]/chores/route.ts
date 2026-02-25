import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const snap = await adminDb
      .collection(`tenants/${tenantId}/chores`)
      .where('assigneeIds', 'array-contains', residentId)
      .orderBy('createdAt', 'desc')
      .get();

    const chores = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate?.toDate?.() ?? null,
      };
    });

    return NextResponse.json({ chores });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
