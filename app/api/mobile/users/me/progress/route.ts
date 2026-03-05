import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

/** Sobriety milestones in days */
const MILESTONES = [7, 14, 30, 60, 90, 120, 180, 270, 365, 547, 730, 1095, 1825];

function getNextMilestone(days: number): { nextMilestoneDays: number; nextMilestone: number } {
  const next = MILESTONES.find(m => m > days) ?? MILESTONES[MILESTONES.length - 1];
  return { nextMilestoneDays: next, nextMilestone: Math.max(0, next - days) };
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = token.uid;
    const tenantId = token.tenant_id as string | undefined;

    // ── 1. Sobriety ──────────────────────────────────────────────────────────
    let sobrietyDays = 0;
    let sobrietyStartDate: string | null = null;

    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        const rawDate = userData.sobrietyDate;
        if (rawDate) {
          const startDate = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
          sobrietyStartDate = startDate.toISOString().split('T')[0];
          sobrietyDays = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86_400_000));
        }
      }
    } catch {
      // Non-fatal — user doc may not exist yet
    }

    const { nextMilestoneDays, nextMilestone } = getNextMilestone(sobrietyDays);

    // ── 2. Course Enrollments ─────────────────────────────────────────────────
    interface EnrollmentData {
      courseId: string;
      status: string;
      progress: number;
      completedLessons: string[];
    }
    interface CourseData {
      title: string;
      curriculum: { lessons: unknown[] }[];
    }

    let courseItems: {
      courseId: string;
      title: string;
      progress: number;
      status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
      completedLessons: number;
      totalLessons: number;
    }[] = [];

    if (tenantId) {
      try {
        const enrollSnap = await adminDb
          .collection(`tenants/${tenantId}/enrollments`)
          .where('userId', '==', uid)
          .limit(20)
          .get();

        const enrollments = enrollSnap.docs.map(d => ({ id: d.id, ...d.data() } as EnrollmentData & { id: string }));

        // Fetch course titles in parallel
        const courseIds = [...new Set(enrollments.map(e => e.courseId))];
        const courseSnaps = await Promise.all(
          courseIds.map(id => adminDb.collection(`tenants/${tenantId}/courses`).doc(id).get())
        );
        const courseMap = new Map<string, CourseData>();
        courseSnaps.forEach(snap => { if (snap.exists) courseMap.set(snap.id, snap.data() as CourseData); });

        courseItems = enrollments.map(e => {
          const course = courseMap.get(e.courseId);
          const totalLessons = course?.curriculum?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
          return {
            courseId: e.courseId,
            title: course?.title ?? 'Unknown Course',
            progress: e.progress ?? 0,
            status: (e.status ?? 'ENROLLED') as 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED',
            completedLessons: e.completedLessons?.length ?? 0,
            totalLessons,
          };
        });
      } catch {
        // Non-fatal
      }
    }

    const enrolledCount = courseItems.length;
    const completedCount = courseItems.filter(c => c.status === 'COMPLETED').length;
    const inProgressCount = courseItems.filter(c => c.status === 'IN_PROGRESS').length;

    // ── 3. Meeting Attendance (this month) ───────────────────────────────────
    let meetingsThisMonth = 0;
    let meetingStreak = 0;

    if (tenantId) {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const attendanceSnap = await adminDb
          .collection(`tenants/${tenantId}/eventAttendance`)
          .where('userId', '==', uid)
          .where('attendedAt', '>=', monthStart)
          .get();

        meetingsThisMonth = attendanceSnap.size;

        // Simple streak: count consecutive weeks with at least 1 meeting (last 8 weeks)
        const weekBuckets = new Set<number>();
        attendanceSnap.docs.forEach(doc => {
          const data = doc.data();
          const attendedAt = data.attendedAt?.toDate ? data.attendedAt.toDate() : new Date(data.attendedAt);
          const weekNum = Math.floor(attendedAt.getTime() / (7 * 86_400_000));
          weekBuckets.add(weekNum);
        });
        const currentWeek = Math.floor(Date.now() / (7 * 86_400_000));
        let w = currentWeek;
        while (weekBuckets.has(w)) { meetingStreak++; w--; }
      } catch {
        // Non-fatal
      }
    }

    // ── 4. Mood (last 7 entries) ─────────────────────────────────────────────
    interface MoodEntry {
      date: string;
      score: number;
    }
    let moods: MoodEntry[] = [];

    try {
      const moodSnap = await adminDb
        .collection(`users/${uid}/moods`)
        .orderBy('date', 'desc')
        .limit(7)
        .get();

      moods = moodSnap.docs.map(d => {
        const data = d.data();
        return {
          date: data.date ?? d.id,
          score: data.score ?? data.mood ?? 3,
        };
      }).reverse(); // oldest first for sparkline
    } catch {
      // Non-fatal — moods collection may not exist
    }

    return NextResponse.json({
      sobriety: {
        days: sobrietyDays,
        startDate: sobrietyStartDate,
        nextMilestone,
        nextMilestoneDays,
      },
      courses: {
        enrolled: enrolledCount,
        completed: completedCount,
        inProgress: inProgressCount,
        items: courseItems,
      },
      meetings: {
        thisMonth: meetingsThisMonth,
        streak: meetingStreak,
      },
      moods,
    });
  } catch (error) {
    console.error('GET /api/mobile/users/me/progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
