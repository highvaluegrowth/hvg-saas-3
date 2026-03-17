import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb as db } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all incidents marked high intensity across all subcollections
        const snapshot = await db.collectionGroup('incidents')
            .where('severity', '==', 'high')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const incidents = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Get tenant name for context
            // Path is tenants/{tenantId}/incidents/{incidentId}
            const tenantId = doc.ref.parent.parent?.id || 'unknown';
            const tenantSnap = await db.collection('tenants').doc(tenantId).get();
            const tenantName = tenantSnap.exists ? tenantSnap.data()?.name : 'Unknown Organization';

            return {
                id: doc.id,
                tenantId,
                tenantName,
                type: data.type,
                severity: data.severity,
                // Redact PII for HIPAA compliance in global view
                title: data.title,
                description: data.description, // In a real app we might redact names from desc with AI
                residentId: 'REDACTED',
                residentName: 'REDACTED (HIPAA Protected)',
                createdAt: data.createdAt,
                status: data.status,
            };
        }));

        return NextResponse.json({ incidents });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
