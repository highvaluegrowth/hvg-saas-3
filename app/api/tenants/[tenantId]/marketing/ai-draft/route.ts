// app/api/tenants/[tenantId]/marketing/ai-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { GoogleGenAI } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';
import type { PostType, DraftPostResult } from '@/features/marketing/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const POST_TYPE_PROMPTS: Record<PostType, string> = {
    bed_availability: 'Write a compassionate, hopeful social media post announcing available beds at a sober living house.',
    success_story: 'Write an inspiring, anonymized success story about a resident in recovery. Keep it uplifting and privacy-safe.',
    event_promo: 'Write an engaging event promotion post for a sober living community event.',
    job_listing: 'Write a compelling job listing post for a position at a sober living house.',
    general: 'Write a warm, community-focused social media update for a sober living organization.',
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const token = await verifyAuthToken(request);
        const { tenantId } = await params;
        if (token.role !== 'super_admin' && token.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { postType, context, tone, platform } = await request.json() as {
            postType: PostType; context: string; tone: string; platform: string;
        };

        // Fetch tenant info for house-specific hashtags
        const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
        const tenant = tenantSnap.data() ?? {};
        const houseName: string = tenant.name ?? 'our sober living home';
        const specializations: string[] = tenant.specializations ?? [];

        const typePrompt = POST_TYPE_PROMPTS[postType] ?? POST_TYPE_PROMPTS.general;
        const prompt = `You are a social media manager for a sober living organization called "${houseName}".

${typePrompt}

Context provided: ${context || 'No specific context — use general recovery messaging.'}
Tone: ${tone}
Target platform: ${platform}
Specializations: ${specializations.join(', ') || 'general recovery'}

Respond ONLY with valid JSON in this exact shape:
{
  "draft": "<the caption text, 1-3 paragraphs, no hashtags in body>",
  "hashtags": {
    "general": ["RecoveryIsPossible", "SoberLiving", "CleanAndSober"],
    "houseSpecific": ["${houseName.replace(/\s+/g, '')}House", "SoberCommunity"],
    "platformOptimized": ["SoberLife", "RecoveryJourney"]
  }
}

Rules:
- draft must be compelling and empathetic, no hashtags inside
- each hashtag array must have 3-5 tags, no # prefix
- houseSpecific tags should reference the house name or specializations
- platformOptimized tags should match ${platform} best practices`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
        // Strip markdown code fences if present
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result: DraftPostResult = JSON.parse(cleaned);

        return NextResponse.json(result);
    } catch (e) {
        console.error('[AI Draft]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
