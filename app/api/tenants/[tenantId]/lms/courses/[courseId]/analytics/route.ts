import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

type Params = Promise<{ tenantId: string; courseId: string }>;

interface EnrollmentRecord {
  id: string;
  userId: string;
  displayName?: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  completedLessons?: string[];
  quizScores?: Record<string, number>;
  enrolledAt?: string;
  lastAccessedAt?: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId, courseId } = await params;
    const token = await verifyAuthToken(request);
    if (token.tenant_id !== tenantId && token.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch enrollments for this course
    const enrollmentsSnap = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('courses')
      .doc(courseId)
      .collection('enrollments')
      .get();

    const enrollments: EnrollmentRecord[] = enrollmentsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId || doc.id,
        displayName: d.displayName || d.email || d.userId || 'Unknown',
        status: d.status || 'ENROLLED',
        progress: typeof d.progress === 'number' ? d.progress : 0,
        completedLessons: d.completedLessons || [],
        quizScores: d.quizScores || {},
        enrolledAt: d.enrolledAt || null,
        lastAccessedAt: d.lastAccessedAt || null,
      };
    });

    const total = enrollments.length;
    const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
    const inProgress = enrollments.filter(e => e.status === 'IN_PROGRESS').length;
    const enrolled = enrollments.filter(e => e.status === 'ENROLLED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average quiz score across all enrollments
    const allScores: number[] = [];
    enrollments.forEach(e => {
      Object.values(e.quizScores || {}).forEach(score => {
        if (typeof score === 'number') allScores.push(score);
      });
    });
    const averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : null;

    // Average progress
    const avgProgress = total > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / total)
      : 0;

    return NextResponse.json({
      stats: { total, completed, inProgress, enrolled, completionRate, averageScore, avgProgress },
      enrollments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    const status = message.includes('Missing') || message.includes('invalid') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
