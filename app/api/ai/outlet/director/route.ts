import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAppUserToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { genai, GEMINI_MODEL } from '@/lib/ai/gemini';
import type { Content, FunctionCall, Part } from '@google/genai';
import { superAdminTierTools, executeTieredTool } from '@/lib/ai/agents';

export const dynamic = 'force-dynamic';

const ChatSchema = z.object({
    message: z.string().min(1),
    conversationId: z.string().optional(),
});

function buildDirectorSystemPrompt(user: { displayName: string }) {
    return `You are HVG Outlet (SuperAdmin Tier), the platform-wide executive director AI for High Value Growth.
Your role is to perform global synthesis, monitor platform health, and assist with high-level administrative tasks across all tenants.

USER: ${user.displayName} (SuperAdmin)

GOALS:
1. Provide cross-tenant analytics and pattern recognition.
2. Moderate and manage universal applications (bed, staff, course, event).
3. Monitor system-wide engagement and financials.
4. Execute bulk operations across the entire platform when requested.

TONE:
Authoritative, data-driven, and highly efficient. Use clear executive summaries.

CAPABILITIES:
- You have access to synthesis tools for platform-wide data.
- You can assign applications to specific tenants.
- You can view global analytics.

CONTEXT:
Current platform state: Production.
Current date: ${new Date().toLocaleDateString()}
`;
}

export async function POST(request: NextRequest) {
    try {
        const { uid, appUser, decodedToken } = await verifyAppUserToken(request);

        const body = await request.json();
        const parsed = ChatSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }

        const { message, conversationId } = parsed.data;

        // Director Route strictly requires super_admin role
        if (decodedToken.role !== 'super_admin') {
            return NextResponse.json({ error: 'Access restricted to Platform Directors' }, { status: 403 });
        }

        const convId = conversationId ?? adminDb.collection('conversations').doc().id;

        // Load conversation history
        let history: Content[] = [];
        if (conversationId) {
            const messagesSnap = await adminDb
                .collection('conversations').doc(convId).collection('messages')
                .orderBy('createdAt', 'asc').limit(20).get();
            history = messagesSnap.docs.map(doc => ({
                role: doc.data().role === 'user' ? 'user' : 'model',
                parts: [{ text: doc.data().content as string }],
            }));
        }

        const contents: Content[] = [...history, { role: 'user', parts: [{ text: message }] }];
        const systemInstruction = buildDirectorSystemPrompt({ displayName: appUser.displayName });

        const response = await genai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: { systemInstruction, tools: superAdminTierTools },
        });

        let finalText = response.text ?? '';
        let componentName: string | undefined;
        let componentData: unknown;

        // Handle function calls
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const primaryFc = functionCalls[0];
            componentName = primaryFc.name;

            const toolResultParts: Part[] = await Promise.all(
                functionCalls.map(async (fc: FunctionCall) => {
                    const toolArgs = (fc.args ?? {}) as Record<string, unknown>;
                    const result = await executeTieredTool(fc.name!, toolArgs, {
                        tier: 'superadmin',
                        uid
                    });

                    if (fc.name === primaryFc.name) componentData = result;
                    return { functionResponse: { name: fc.name!, response: result } } as Part;
                })
            );

            const followUpContents: Content[] = [
                ...contents,
                { role: 'model', parts: response.candidates![0].content!.parts! },
                { role: 'user', parts: toolResultParts },
            ];

            const followUp = await genai.models.generateContent({
                model: GEMINI_MODEL,
                contents: followUpContents,
                config: { systemInstruction },
            });

            finalText = followUp.text ?? '';
        }

        // Persist to Firestore
        const batch = adminDb.batch();
        const convRef = adminDb.collection('conversations').doc(convId);

        batch.set(convRef, { userId: uid, persona: 'director', tier: 'superadmin', updatedAt: new Date() }, { merge: true });
        batch.set(convRef.collection('messages').doc(), { role: 'user', content: message, createdAt: new Date() });

        const assistantPayload: any = { role: 'assistant', content: finalText, createdAt: new Date() };
        if (componentName && componentData) {
            assistantPayload.component = componentName;
            assistantPayload.componentData = componentData;
        }
        batch.set(convRef.collection('messages').doc(), assistantPayload);

        await batch.commit();

        return NextResponse.json({
            reply: finalText,
            conversationId: convId,
            persona: 'director',
            tier: 'superadmin',
            component: componentName,
            componentData
        });
    } catch (error: unknown) {
        const e = error as { message?: string; statusCode?: number };
        return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
    }
}
