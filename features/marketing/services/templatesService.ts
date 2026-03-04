// features/marketing/services/templatesService.ts
import { adminDb } from '@/lib/firebase/admin';
import type { MarketingTemplate } from '../types';

export const templatesService = {
    async list(activeOnly = true): Promise<MarketingTemplate[]> {
        let q = adminDb.collection('marketingTemplates').orderBy('createdAt', 'desc');
        if (activeOnly) {
            q = adminDb.collection('marketingTemplates')
                .where('active', '==', true)
                .orderBy('createdAt', 'desc') as typeof q;
        }
        const snap = await q.get();
        return snap.docs.map(d => d.data() as MarketingTemplate);
    },

    async create(uid: string, data: Omit<MarketingTemplate, 'id' | 'createdBy' | 'createdAt'>): Promise<MarketingTemplate> {
        const ref = adminDb.collection('marketingTemplates').doc();
        const template: MarketingTemplate = {
            ...data,
            id: ref.id,
            createdBy: uid,
            createdAt: new Date().toISOString(),
        };
        await ref.set(template);
        return template;
    },

    // MarketingTemplate has no updatedAt field — state changes via 'active' boolean toggle only.
    async update(templateId: string, updates: Partial<MarketingTemplate>): Promise<void> {
        await adminDb.collection('marketingTemplates').doc(templateId).update(updates);
    },
};
