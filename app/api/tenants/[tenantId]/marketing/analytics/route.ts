// app/api/tenants/[tenantId]/marketing/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import type { SocialPost, SocialAccount, SocialPlatform, PostType, PostStatus } from '@/features/marketing/types';

export const dynamic = 'force-dynamic';


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;

        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all posts
        const postsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('socialPosts')
            .get();

        const posts: SocialPost[] = postsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                tenantId: data.tenantId ?? tenantId,
                content: data.content ?? '',
                platforms: data.platforms ?? [],
                hashtags: data.hashtags ?? [],
                status: data.status ?? 'draft',
                postType: data.postType ?? 'general',
                scheduledAt: data.scheduledAt ?? null,
                publishedAt: data.publishedAt ?? null,
                createdBy: data.createdBy ?? '',
                createdAt: data.createdAt ?? new Date().toISOString(),
                updatedAt: data.updatedAt ?? new Date().toISOString(),
                aiGenerated: data.aiGenerated ?? false,
                sourceContext: data.sourceContext ?? {},
                engagement: data.engagement ?? undefined,
            } as SocialPost;
        });

        // Fetch all accounts
        const accountsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('socialAccounts')
            .get();

        const accounts: SocialAccount[] = accountsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                platform: data.platform,
                accessToken: data.accessToken ?? '',
                tokenExpiresAt: data.tokenExpiresAt ?? '',
                accountName: data.accountName ?? '',
                accountId: data.accountId ?? '',
                connectedAt: data.connectedAt ?? '',
                connectedBy: data.connectedBy ?? '',
                status: data.status ?? 'expired',
            } as SocialAccount;
        });

        // --- Aggregations ---

        const total = posts.length;

        // byStatus
        const byStatus: Record<PostStatus, number> = {
            draft: 0,
            scheduled: 0,
            published: 0,
            failed: 0,
        };
        for (const post of posts) {
            byStatus[post.status] = (byStatus[post.status] ?? 0) + 1;
        }

        // byType
        const byType: Record<PostType, number> = {
            bed_availability: 0,
            success_story: 0,
            event_promo: 0,
            job_listing: 0,
            general: 0,
        };
        for (const post of posts) {
            byType[post.postType] = (byType[post.postType] ?? 0) + 1;
        }

        // byPlatform — each post can target multiple platforms
        const byPlatform: Record<SocialPlatform, number> = {
            facebook: 0,
            instagram: 0,
            tiktok: 0,
            x: 0,
            linkedin: 0,
        };
        for (const post of posts) {
            for (const platform of post.platforms) {
                byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;
            }
        }

        // aiVsManual
        const ai = posts.filter(p => p.aiGenerated).length;
        const manual = posts.filter(p => !p.aiGenerated).length;

        // thisMonth / lastMonth
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const thisMonth = posts.filter(p => p.createdAt >= thisMonthStart).length;
        const lastMonth = posts.filter(
            p => p.createdAt >= lastMonthStart && p.createdAt < thisMonthStart
        ).length;

        // recentPublished — last 10 by publishedAt desc
        const recentPublished = posts
            .filter(p => p.status === 'published' && p.publishedAt)
            .sort((a, b) => {
                const aTime = a.publishedAt ?? '';
                const bTime = b.publishedAt ?? '';
                return bTime.localeCompare(aTime);
            })
            .slice(0, 10);

        // topHashtags — top 10 by frequency
        const hashtagCounts: Record<string, number> = {};
        for (const post of posts) {
            for (const tag of post.hashtags) {
                const normalized = tag.startsWith('#') ? tag : `#${tag}`;
                hashtagCounts[normalized] = (hashtagCounts[normalized] ?? 0) + 1;
            }
        }
        const topHashtags = Object.entries(hashtagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json({
            total,
            byStatus,
            byType,
            byPlatform,
            aiVsManual: { ai, manual },
            thisMonth,
            lastMonth,
            recentPublished,
            topHashtags,
            accounts,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
