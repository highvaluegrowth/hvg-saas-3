import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; courseId: string; lessonId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, courseId, lessonId } = await params;
    const uid = token.uid;

    // Verify enrollment exists
    const enrollmentRef = adminDb.doc(`users/${uid}/courseEnrollments/${courseId}`);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Count total lessons from course curriculum
    const courseSnap = await adminDb.doc(`tenants/${tenantId}/courses/${courseId}`).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const curriculum: { lessons: { id: string }[] }[] = courseSnap.data()?.curriculum ?? [];
    const allLessonIds: string[] = curriculum.flatMap((mod) =>
      (mod.lessons ?? []).map((l) => l.id)
    );
    const totalLessons = allLessonIds.length;

    // Add lessonId to completedLessons (idempotent via arrayUnion)
    await enrollmentRef.update({
      completedLessons: FieldValue.arrayUnion(lessonId),
    });

    // Re-read to calculate accurate progress
    const updatedSnap = await enrollmentRef.get();
    const completedLessons: string[] = updatedSnap.data()?.completedLessons ?? [];
    const uniqueCompleted = new Set(completedLessons).size;
    const progress = totalLessons > 0 ? Math.round((uniqueCompleted / totalLessons) * 100) : 0;
    const courseStatus = progress === 100 ? 'completed' : 'active';

    await enrollmentRef.update({ progress, status: courseStatus });

    return NextResponse.json({ success: true, progress, status: courseStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
