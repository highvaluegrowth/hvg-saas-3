import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';
import { getMatchedTenants } from '@/features/applications/services/matchingService';
import type { BedHints } from '@/features/applications/services/matchingService';

export const dynamic = 'force-dynamic';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);

        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId } = await params;
        const doc = await db.collection('applications').doc(applicationId).get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const app = doc.data()!;
        const prefs: string[] = [];
        if (app.data?.gender) prefs.push(app.data.gender);
        if (app.data?.genderPreference) prefs.push(app.data.genderPreference);
        if (app.data?.housePref) prefs.push(app.data.housePref);
        if (app.data?.positionType) prefs.push(app.data.positionType);

        // Build BedHints for bed applications
        const bedHints: BedHints | undefined = app.type === 'bed' ? {
            matStatus: typeof app.data?.matStatus === 'boolean' ? app.data.matStatus : undefined,
            genderPreference: (app.data?.housePref as string | undefined) ?? (app.data?.genderPreference as string | undefined),
            isOpioidUse: app.data?.isOpioidUse === true,
            maxDistance: typeof app.data?.maxDistance === 'number' ? app.data.maxDistance : undefined,
            incomeBracket: app.data?.incomeBracket as string | undefined,
        } : undefined;

        const matches = await getMatchedTenants(app.zipCode ?? '', prefs, 10, bedHints);
        return NextResponse.json({ matches });
    } catch (error) {
        console.error('GET /api/admin/applications/[applicationId]/matches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
