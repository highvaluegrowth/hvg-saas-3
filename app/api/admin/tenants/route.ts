import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { tenantService } from '@/features/tenant/services/tenantService';
import { AuthError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
    try {
        const decodedToken = await verifyAuthToken(request);

        if (decodedToken.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        const result = await tenantService.query({
            where: [{ field: 'status', operator: '==', value: status }],
        });

        // Sort by createdAt desc by default
        const sorted = result.items.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
        });

        return NextResponse.json({ tenants: sorted });
    } catch (error: any) {
        console.error('Error fetching admin tenants:', error);
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }
}
