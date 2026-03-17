import { Type, Tool } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';

export const marketingTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'draft_social_post',
                description: 'Generate a social media post draft with hashtags using AI. Returns draft caption and categorized hashtag suggestions.',
                parameters: {
                    type: Type.OBJECT,
                    required: ['postType', 'context'],
                    properties: {
                        postType: { type: Type.STRING, description: 'Type of post: bed_availability | success_story | event_promo | job_listing | general' },
                        context: { type: Type.STRING, description: 'Context or description of what the post should say' },
                        tone: { type: Type.STRING, description: 'Desired tone: professional | warm | urgent | celebratory (default: warm)' },
                        platform: { type: Type.STRING, description: 'Target platform: facebook | instagram | tiktok | x | linkedin (default: facebook)' },
                    },
                },
            },
            {
                name: 'get_marketing_posts',
                description: 'Get social media posts from the marketing library, optionally filtered by status',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, description: 'Filter by post status: draft | scheduled | published | failed (omit for all)' },
                        limit: { type: Type.NUMBER, description: 'Max posts to return (default 20)' },
                    },
                },
            },
            {
                name: 'approve_post',
                description: 'Update a social media post status to scheduled',
                parameters: {
                    type: Type.OBJECT,
                    required: ['postId'],
                    properties: {
                        postId: { type: Type.STRING, description: 'The ID of the post to approve/schedule' },
                        scheduledAt: { type: Type.STRING, description: 'ISO 8601 datetime to schedule. Omit to mark as ready-to-publish.' },
                    },
                },
            },
        ]
    }
];

export async function executeMarketingTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { tenantId: string; uid: string }
): Promise<Record<string, unknown>> {
    const { tenantId } = context;

    if (toolName === 'draft_social_post') {
        const { postType, context: postContext } = args as { postType: string; context: string };
        return {
            message: `To draft a ${postType} post, use the AI Compose tool at /${tenantId}/marketing/compose. Here is a quick draft based on your context: "${postContext}". Navigate to Marketing → Compose for the full AI generation experience with hashtag selection.`,
            suggestedUrl: `/${tenantId}/marketing/compose`,
        };
    }

    if (toolName === 'get_marketing_posts') {
        const { status, limit = 20 } = args as { status?: string; limit?: number };
        const base = adminDb.collection('tenants').doc(tenantId).collection('socialPosts');
        const q = status
            ? base.where('status', '==', status).orderBy('createdAt', 'desc').limit(limit)
            : base.orderBy('createdAt', 'desc').limit(limit);
        const snap = await q.get();
        const posts = snap.docs.map(d => {
            const p = d.data();
            return { id: d.id, content: (p.content as string)?.slice(0, 80), status: p.status, platforms: p.platforms, scheduledAt: p.scheduledAt, createdAt: p.createdAt };
        });
        return { count: posts.length, posts };
    }

    if (toolName === 'approve_post') {
        const { postId, scheduledAt } = args as { postId: string; scheduledAt?: string };
        const updates: Record<string, unknown> = {
            status: 'scheduled',
            updatedAt: new Date().toISOString(),
        };
        if (scheduledAt) updates.scheduledAt = scheduledAt;
        await adminDb.collection('tenants').doc(tenantId).collection('socialPosts').doc(postId).update(updates);
        return { success: true, postId, status: 'scheduled' };
    }

    return { error: `Unknown marketing tool: ${toolName}` };
}
