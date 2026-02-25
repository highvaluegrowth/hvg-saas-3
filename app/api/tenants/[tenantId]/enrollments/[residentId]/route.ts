import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createEnrollmentService } from '@/features/enrollments/services/enrollmentService';
import { UpdateEnrollmentSchema } from '@/features/enrollments/schemas/enrollment.schemas';

type Params = Promise<{ tenantId: string; residentId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, residentId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollmentService = createEnrollmentService(tenantId);
    const enrollment = await enrollmentService.getByResidentId(residentId);
    if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ enrollment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, residentId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateEnrollmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const enrollmentService = createEnrollmentService(tenantId);
    await enrollmentService.updateEnrollment(residentId, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
