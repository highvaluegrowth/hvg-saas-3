import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ houseId: string }> }
) {
    try {
        const { houseId } = await params;
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
        }

        const houseRef = adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('houses')
            .doc(houseId);

        const snap = await houseRef.get();

        if (!snap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }

        return NextResponse.json({ house: { id: snap.id, ...snap.data() } });
    } catch (error: any) {
        console.error('Error fetching house:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
