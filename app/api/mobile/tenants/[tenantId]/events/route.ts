import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = await verifyAuthToken(request);
    const { tenantId } = await params;
    const userId = token.uid;

    const now = new Date();

    // Fetch all upcoming events for this tenant
    const eventsSnap = await adminDb
      .collection(`tenants/${tenantId}/events`)
      .where('scheduledAt', '>=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(50)
      .get();

    // Get user's houseId from their resident record in this tenant
    let userHouseId: string | null = null;
    const residentSnap = await adminDb
      .collection(`tenants/${tenantId}/residents`)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!residentSnap.empty) {
      userHouseId = residentSnap.docs[0].data().houseId ?? null;
    }

    // User is enrolled in this tenant if they have a resident record OR their token tenant matches
    const isEnrolledInTenant = !residentSnap.empty || token.tenant_id === tenantId;

    const events = eventsSnap.docs
      .map((doc) => {
        const data = doc.data();
        const visibility: string = data.visibility ?? 'tenant';

        // Apply access control
        if (visibility === 'universal') {
          // everyone sees it
        } else if (visibility === 'tenant' && !isEnrolledInTenant) {
          return null;
        } else if (visibility === 'house') {
          if (!userHouseId || data.houseId !== userHouseId) return null;
        }

        return {
          id: doc.id,
          title: data.title ?? '',
          description: data.description ?? null,
          scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() ?? data.scheduledAt,
          duration: data.duration ?? null,
          location: data.location ?? null,
          type: data.type ?? null,
          visibility,
          recurrence: data.recurrence ?? null,
          attendeeCount: (data.attendeeIds ?? []).length,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
