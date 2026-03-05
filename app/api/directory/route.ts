import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .where('directory.listed', '==', true)
      .get();

    const tenants = snapshot.docs.map((doc) => {
      const data = doc.data();
      const dir = data.directory ?? {};
      return {
        id: doc.id,
        name: data.name ?? '',
        city: data.city ?? dir.city ?? '',
        state: data.state ?? dir.state ?? '',
        description: dir.bio ?? data.description ?? '',
        logoURL: dir.logoUrl ?? data.logoURL ?? '',
        specializations: dir.specializations ?? [],
        amenities: dir.amenities ?? [],
        acceptedFunding: dir.acceptedFunding ?? [],
        website: dir.website ?? '',
      };
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('GET /api/directory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
