// app/api/mobile/tenants/[tenantId]/courses/route.ts
// Returns published courses for a tenant, annotated with the user's enrollment status.

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { courseService } from '@/features/lms/services/courseService';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;
    const uid = token.uid;

    // Fetch published courses + user's enrollments in parallel
    const [courses, enrollSnap] = await Promise.all([
      courseService.list(tenantId),
      adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('enrollments')
        .where('userId', '==', uid)
        .get(),
    ]);

    // Map enrollment courseId → enrollment data
    const enrollmentMap: Record<string, { progress: number; status: string; completedLessons: number }> = {};
    enrollSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.courseId) {
        enrollmentMap[data.courseId] = {
          progress: data.progress ?? 0,
          status: data.status ?? 'ENROLLED',
          completedLessons: data.completedLessons ?? 0,
        };
      }
    });

    const published = courses.filter((c) => c.published);

    const result = published.map((c) => {
      const totalLessons = c.curriculum.reduce((s, m) => s + m.lessons.length, 0);
      const enroll = enrollmentMap[c.id];
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        totalLessons,
        moduleCount: c.curriculum.length,
        enrolled: !!enroll,
        progress: enroll?.progress ?? 0,
        enrollmentStatus: enroll?.status ?? null,
        completedLessons: enroll?.completedLessons ?? 0,
      };
    });

    // Enrolled first, then available
    result.sort((a, b) => {
      if (a.enrolled && !b.enrolled) return -1;
      if (!a.enrolled && b.enrolled) return 1;
      return 0;
    });

    return NextResponse.json({ courses: result });
  } catch (error) {
    console.error('GET /api/mobile/tenants/[tenantId]/courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
