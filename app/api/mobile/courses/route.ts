import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAuthToken(request);

    // Fetch all tenants for name lookup
    const tenantsSnap = await adminDb.collection('tenants').get();
    const tenantNames: Record<string, string> = {};
    for (const doc of tenantsSnap.docs) {
      tenantNames[doc.id] = doc.data().name ?? doc.id;
    }

    // Fetch universal courses across all tenants
    const courses: object[] = [];
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const coursesSnap = await adminDb
        .collection(`tenants/${tenantId}/courses`)
        .where('visibility', '==', 'universal')
        .get();

      for (const courseDoc of coursesSnap.docs) {
        const data = courseDoc.data();
        const curriculum: { lessons: unknown[] }[] = data.curriculum ?? [];
        const totalLessons = curriculum.reduce(
          (sum: number, mod: { lessons: unknown[] }) => sum + (mod.lessons?.length ?? 0),
          0
        );
        courses.push({
          id: courseDoc.id,
          tenantId,
          tenantName: tenantNames[tenantId],
          title: data.title ?? '',
          description: data.description ?? '',
          totalLessons,
          moduleCount: curriculum.length,
          visibility: 'universal',
        });
      }
    }

    return NextResponse.json({ courses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
