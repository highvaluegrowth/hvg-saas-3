import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService, CurriculumModule } from '@/features/lms/services/courseService';
import { lessonService } from '@/features/lms/services/lessonService';

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

        // Save the structure to the course document
        await courseService.saveCurriculum(tenantId, courseId, curriculum);

        // Ensure every lesson has a Firestore document (stub only — does NOT overwrite content)
        for (const module of curriculum) {
            for (const lesson of module.lessons) {
                await lessonService.upsert(tenantId, courseId, lesson.id, {
                    id: lesson.id,
                    courseId,
                    tenantId,
                    title: lesson.title,
                    type: lesson.type,
                    order: lesson.order,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
