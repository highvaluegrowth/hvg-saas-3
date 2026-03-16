import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';


// Public route — no auth required. Residents browse tenants before joining.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    let query = adminDb
      .collection('tenants')
      .where('status', '==', 'active');

    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    const snap = await query.get();

    const tenants = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        city: data.city,
        state: data.state,
        description: data.description,
        logoURL: data.logoURL,
        tags: data.tags || [],
      };
    });

    return NextResponse.json({ tenants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
