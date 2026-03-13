import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAuthToken(request);

    const now = new Date();
    const tenantsSnap = await adminDb.collection('tenants').get();

    interface EventItem {
      id: string;
      tenantId: string;
      tenantName: string;
      title: string;
      description: string | null;
      scheduledAt: string;
      duration: number | null;
      location: string | null;
      type: string | null;
      visibility: string;
      recurrence: unknown;
    }

    const events: EventItem[] = [];

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantName = (tenantDoc.data().name as string) ?? tenantId;

      const eventsSnap = await adminDb
        .collection(`tenants/${tenantId}/events`)
        .where('visibility', '==', 'universal')
        .where('scheduledAt', '>=', now)
        .orderBy('scheduledAt', 'asc')
        .limit(20)
        .get();

      for (const eventDoc of eventsSnap.docs) {
        const data = eventDoc.data();
        events.push({
          id: eventDoc.id,
          tenantId,
          tenantName,
          title: data.title ?? '',
          description: data.description ?? null,
          scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() ?? data.scheduledAt,
          duration: data.duration ?? null,
          location: data.location ?? null,
          type: data.type ?? null,
          visibility: 'universal',
          recurrence: data.recurrence ?? null,
        });
      }
    }

    // Sort all events by scheduledAt ascending
    events.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
