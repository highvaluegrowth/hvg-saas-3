// features/marketing/services/postsService.ts
// Timestamps: ISO 8601 strings throughout this module. Server timestamps are not used to keep types.ts as plain strings.
import { adminDb } from '@/lib/firebase/admin';
import type { SocialPost, CreatePostPayload } from '../types';

function postsRef(tenantId: string) {
    return adminDb.collection('tenants').doc(tenantId).collection('socialPosts');
}

type PostUpdateFields = Omit<Partial<SocialPost>, 'id' | 'tenantId' | 'createdBy' | 'createdAt'>;

export const postsService = {
    async create(tenantId: string, uid: string, payload: CreatePostPayload): Promise<SocialPost> {
        const now = new Date().toISOString();
        const ref = postsRef(tenantId).doc();
        const post: SocialPost = {
            id: ref.id,
            tenantId,
            content: payload.content,
            platforms: payload.platforms,
            hashtags: payload.hashtags,
            status: payload.scheduledAt ? 'scheduled' : 'draft',
            postType: payload.postType,
            scheduledAt: payload.scheduledAt ?? null,
            publishedAt: null,
            createdBy: uid,
            createdAt: now,
            updatedAt: now,
            aiGenerated: payload.aiGenerated,
            sourceContext: payload.sourceContext ?? {},
        };
        await ref.set(post);
        return post;
    },

    async list(tenantId: string, status?: string, limit = 50): Promise<SocialPost[]> {
        const base = postsRef(tenantId);
        const q = status
            ? base.where('status', '==', status).orderBy('createdAt', 'desc').limit(limit)
            : base.orderBy('createdAt', 'desc').limit(limit);
        const snap = await q.get();
        return snap.docs.map(d => d.data() as SocialPost);
    },

    async update(tenantId: string, postId: string, updates: PostUpdateFields): Promise<void> {
        await postsRef(tenantId).doc(postId).update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    },

    async delete(tenantId: string, postId: string): Promise<void> {
        await postsRef(tenantId).doc(postId).delete();
    },

    async countByStatus(tenantId: string): Promise<Record<string, number>> {
        const statuses = ['draft', 'scheduled', 'published', 'failed'];
        const counts = await Promise.all(
            statuses.map(async (s) => {
                const snap = await postsRef(tenantId).where('status', '==', s).count().get();
                return [s, snap.data().count] as [string, number];
            })
        );
        return Object.fromEntries(counts);
    },
};
