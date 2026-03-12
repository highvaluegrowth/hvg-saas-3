import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await verifyAuthToken(request);
    const { tenantId } = await params;

    const housesSnap = await adminDb
      .collection(`tenants/${tenantId}/houses`)
      .get();

    const houses = housesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        address: data.address ?? null,
        phone: data.phone ?? null,
        capacity: data.capacity ?? 0,
        status: data.status ?? 'active',
        managerId: data.managerId ?? null,
      };
    });

    return NextResponse.json({ houses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('Unauthorized') || message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
