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
      const data = doc.data();
      tenantNames[doc.id] = data.name ?? doc.id;
    }

    // Fetch all houses across all tenants
    const houses: object[] = [];
    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const housesSnap = await adminDb
        .collection(`tenants/${tenantId}/houses`)
        .get();
      for (const houseDoc of housesSnap.docs) {
        const data = houseDoc.data();
        houses.push({
          id: houseDoc.id,
          tenantId,
          tenantName: tenantNames[tenantId],
          name: data.name ?? '',
          address: data.address ?? null,
          city: data.address?.city ?? null,
          state: data.address?.state ?? null,
          capacity: data.capacity ?? 0,
          status: data.status ?? 'active',
        });
      }
    }

    return NextResponse.json({ houses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
