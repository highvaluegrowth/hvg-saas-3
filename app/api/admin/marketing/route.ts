// app/api/admin/marketing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { templatesService } from '@/features/marketing/services/templatesService';

export async function GET(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (token.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const tenantsSnap = await adminDb.collection('tenants').where('status', '==', 'active').get();
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const stats = await Promise.all(tenantsSnap.docs.map(async doc => {
            const tenant = doc.data();
            const postsSnap = await adminDb.collection('tenants').doc(doc.id)
                .collection('socialPosts').where('createdAt', '>=', startOfMonth.toISOString()).count().get();
            const lastPublishedSnap = await adminDb.collection('tenants').doc(doc.id)
                .collection('socialPosts').where('status', '==', 'published').orderBy('publishedAt', 'desc').limit(1).get();
            return {
                tenantId: doc.id,
                name: tenant.name ?? doc.id,
                postsThisMonth: postsSnap.data().count,
                lastPublished: lastPublishedSnap.docs[0]?.data().publishedAt ?? null,
            };
        }));

        const templates = await templatesService.list(false);
        return NextResponse.json({ stats, templates });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
