import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyResidentTenantAccess } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string; choreId: string }>;

// Residents can't set 'overdue' — that's a system/staff action
const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done']),
});

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, choreId } = await params;
    const { residentId } = await verifyResidentTenantAccess(request, tenantId);

    const choreRef = adminDb.collection(`tenants/${tenantId}/chores`).doc(choreId);
    const choreDoc = await choreRef.get();
    if (!choreDoc.exists) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    const choreData = choreDoc.data()!;
    if (!(choreData.assigneeIds ?? []).includes(residentId)) {
      return NextResponse.json({ error: 'Not assigned to this chore' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await choreRef.update({ status: parsed.data.status, updatedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
