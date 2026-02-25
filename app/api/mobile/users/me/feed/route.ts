import { NextRequest, NextResponse } from 'next/server';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { appUser } = await verifyResidentToken(request);

    if (!appUser.residentId) {
      return NextResponse.json({ events: [], chores: [] });
    }

    // Find all active/waitlist enrollments across all tenants (collection group)
    const enrollSnap = await adminDb
      .collectionGroup('enrollments')
      .where('residentId', '==', appUser.residentId)
      .where('status', 'in', ['active', 'waitlist'])
      .get();

    if (enrollSnap.empty) {
      return NextResponse.json({ events: [], chores: [] });
    }

    const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
    const now = new Date();

    // Fan-out: parallel reads across all enrolled tenants
    const [eventsResults, choresResults] = await Promise.all([
      Promise.all(
        tenantIds.map(tid =>
          adminDb
            .collection(`tenants/${tid}/events`)
            .where('scheduledAt', '>=', now)
            .orderBy('scheduledAt', 'asc')
            .limit(10)
            .get()
            .then(snap =>
              snap.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  tenantId: tid,
                  title: data.title,
                  description: data.description,
                  scheduledAt: data.scheduledAt?.toDate?.() ?? null,
                  duration: data.duration,
                  location: data.location,
                  type: data.type,
                };
              })
            )
        )
      ),
      Promise.all(
        tenantIds.map(tid =>
          adminDb
            .collection(`tenants/${tid}/chores`)
            .where('assigneeIds', 'array-contains', appUser.residentId!)
            .where('status', 'in', ['pending', 'in_progress'])
            .get()
            .then(snap =>
              snap.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  tenantId: tid,
                  title: data.title,
                  description: data.description,
                  status: data.status,
                  priority: data.priority,
                  dueDate: data.dueDate?.toDate?.() ?? null,
                };
              })
            )
        )
      ),
    ]);

    // Flatten and sort events chronologically
    const events = eventsResults
      .flat()
      .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));

    const chores = choresResults.flat();

    return NextResponse.json({ events, chores });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
