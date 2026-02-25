import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { createEnrollmentService } from '@/features/enrollments/services/enrollmentService';
import { CreateEnrollmentSchema } from '@/features/enrollments/schemas/enrollment.schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const houseId = url.searchParams.get('houseId');

    const enrollmentService = createEnrollmentService(tenantId);

    let enrollments;
    if (houseId) {
      enrollments = await enrollmentService.getByHouseId(houseId);
    } else if (status) {
      const { items } = await enrollmentService.query({
        where: [{ field: 'status', operator: '==', value: status }],
      });
      enrollments = items;
    } else {
      const { items } = await enrollmentService.query({
        orderBy: { field: 'createdAt', direction: 'desc' },
      });
      enrollments = items;
    }

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;

    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateEnrollmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const enrollmentService = createEnrollmentService(tenantId);
    const enrollment = await enrollmentService.enroll(parsed.data);

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode ?? 500 });
  }
}
