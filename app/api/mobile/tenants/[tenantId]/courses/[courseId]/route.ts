// app/api/mobile/tenants/[tenantId]/courses/[courseId]/route.ts
// Returns course detail with curriculum + lesson content for mobile lesson viewer.

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { courseService } from '@/features/lms/services/courseService';
import { lessonService } from '@/features/lms/services/lessonService';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string; courseId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, courseId } = await params;

    const course = await courseService.get(tenantId, courseId);
    if (!course || !course.published) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch all lesson content in parallel across all modules
    const allLessonIds: string[] = [];
    course.curriculum.forEach((mod) => mod.lessons.forEach((l) => allLessonIds.push(l.id)));

    const lessonDocs = await Promise.all(
      allLessonIds.map((id) => lessonService.get(tenantId, courseId, id).catch(() => null))
    );

    // Build a map id → content
    const lessonContentMap: Record<string, object> = {};
    lessonDocs.forEach((doc) => {
      if (doc) lessonContentMap[doc.id] = doc;
    });

    // Merge curriculum structure + content
    const modules = course.curriculum
      .sort((a, b) => a.order - b.order)
      .map((mod) => ({
        id: mod.id,
        title: mod.title,
        order: mod.order,
        lessons: mod.lessons
          .sort((a, b) => a.order - b.order)
          .map((l) => ({
            ...l,
            ...(lessonContentMap[l.id] ?? {}),
          })),
      }));

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        modules,
      },
    });
  } catch (error) {
    console.error('GET /api/mobile/tenants/[tenantId]/courses/[courseId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
