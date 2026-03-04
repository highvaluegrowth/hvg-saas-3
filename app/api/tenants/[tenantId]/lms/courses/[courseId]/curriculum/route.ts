// app/api/tenants/[tenantId]/lms/courses/[courseId]/curriculum/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService, CurriculumModule } from '@/features/lms/services/courseService';

export const dynamic = 'force-dynamic';


export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId, courseId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const body = await request.json();
        const curriculum: CurriculumModule[] = body.curriculum;
        if (!Array.isArray(curriculum)) {
            return NextResponse.json({ error: 'curriculum must be an array' }, { status: 400 });
        }
        await courseService.saveCurriculum(tenantId, courseId, curriculum);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
