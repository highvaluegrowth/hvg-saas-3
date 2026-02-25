import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Public route — no auth required. Residents browse tenants before joining.
export async function GET() {
  try {
    const snap = await adminDb
      .collection('tenants')
      .where('status', '==', 'active')
      .get();

    const tenants = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        city: data.city,
        state: data.state,
        description: data.description,
        logoURL: data.logoURL,
      };
    });

    return NextResponse.json({ tenants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
