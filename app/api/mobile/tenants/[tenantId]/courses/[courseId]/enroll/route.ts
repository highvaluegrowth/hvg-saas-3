import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; courseId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId, courseId } = await params;
    const uid = token.uid;

    // Fetch course
    const courseRef = adminDb.doc(`tenants/${tenantId}/courses/${courseId}`);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const course = courseSnap.data()!;
    const visibility = course.visibility ?? 'tenant';

    // Access check for tenant-scoped courses
    if (visibility === 'tenant') {
      // Allow if token has tenant_id claim matching this tenant
      // OR if user has an active enrollment in this tenant
      const tenantIdClaim = token.tenant_id;
      if (tenantIdClaim !== tenantId && token.role !== 'super_admin') {
        // Check Firestore enrollment as fallback
        const enrollmentsSnap = await adminDb
          .collection(`users/${uid}/enrollments`)
          .where('tenantId', '==', tenantId)
          .where('status', 'in', ['active', 'approved'])
          .limit(1)
          .get();
        if (enrollmentsSnap.empty) {
          return NextResponse.json({ error: 'Forbidden: not enrolled in this tenant' }, { status: 403 });
        }
      }
    }

    // Check if already enrolled
    const enrollmentRef = adminDb.doc(`users/${uid}/courseEnrollments/${courseId}`);
    const existing = await enrollmentRef.get();
    if (existing.exists) {
      return NextResponse.json({ success: true, alreadyEnrolled: true });
    }

    // Create enrollment
    await enrollmentRef.set({
      courseId,
      tenantId,
      enrolledAt: FieldValue.serverTimestamp(),
      status: 'active',
      progress: 0,
      completedLessons: [],
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
