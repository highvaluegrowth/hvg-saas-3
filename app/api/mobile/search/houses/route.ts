import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as geofire from 'geofire-common';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const radiusStr = searchParams.get('radius'); // in km

        if (!latStr || !lngStr || !radiusStr) {
            return NextResponse.json({ error: 'Missing lat, lng, or radius' }, { status: 400 });
        }

        const center: [number, number] = [parseFloat(latStr), parseFloat(lngStr)];
        const radiusInKm = parseFloat(radiusStr);
        const radiusInM = radiusInKm * 1000;

        if (isNaN(center[0]) || isNaN(center[1]) || isNaN(radiusInKm)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];

        // Collection group query to search all houses across all tenants
        const housesGroupRef = adminDb.collectionGroup('houses');

        for (const b of bounds) {
            const q = housesGroupRef
                .orderBy('geohash')
                .startAt(b[0])
                .endAt(b[1])
                .limit(50); // Optional limit to prevent massive reads

            promises.push(q.get());
        }

        const snapshots = await Promise.all(promises);
        const matchingDocs: any[] = [];

        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const data = doc.data();

                // House must be active and have location
                if (data.status !== 'active') continue;
                if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
                    continue;
                }

                const distanceInKm = geofire.distanceBetween([data.location.lat, data.location.lng], center);
                const distanceInM = distanceInKm * 1000;

                if (distanceInM <= radiusInM) {
                    matchingDocs.push({
                        id: doc.id,
                        tenantId: doc.ref.parent.parent?.id, // Extract tenantId from the path
                        distance: distanceInKm,
                        ...data,
                    });
                }
            }
        }

        // Sort by distance ascending
        matchingDocs.sort((a, b) => a.distance - b.distance);

        return NextResponse.json({ houses: matchingDocs });

    } catch (error: any) {
        console.error('Error fetching houses by location:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
