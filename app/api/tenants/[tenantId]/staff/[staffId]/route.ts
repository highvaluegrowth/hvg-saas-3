import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createStaffService } from '@/features/staff/services/staffService';
import { UpdateStaffSchema } from '@/features/staff/schemas/staff.schemas';
import { canManageStaff } from '@/lib/utils/permissions';
import type { UserRole } from '@/features/auth/types/auth.types';

type Params = Promise<{ tenantId: string; staffId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, staffId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const staffService = createStaffService(tenantId);
    const staff = await staffService.getById(staffId);
    if (!staff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, staffId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canManageStaff(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const staffService = createStaffService(tenantId);
    await staffService.updateStaff(staffId, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, staffId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canManageStaff(token.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const staffService = createStaffService(tenantId);
    await staffService.deactivate(staffId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
