import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyResidentToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { genai, GEMINI_MODEL } from '@/lib/ai/gemini';
import { Type } from '@google/genai';
import type { Content, FunctionCall, Part, Tool } from '@google/genai';

const ChatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

// Tool declarations for Gemini function calling
const recoveryTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_upcoming_events',
        description:
          'Get upcoming events for the resident across all their enrolled organizations',
        parameters: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.NUMBER,
              description: 'Number of days to look ahead (default 7)',
            },
          },
        },
      },
      {
        name: 'get_chore_status',
        description: 'Get current chores assigned to the resident',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_sobriety_stats',
        description: 'Get sobriety stats for the resident based on their sobrietyDate',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'log_mood',
        description: 'Log a mood entry for the resident',
        parameters: {
          type: Type.OBJECT,
          required: ['mood', 'note'],
          properties: {
            mood: {
              type: Type.STRING,
              description: 'How the resident is feeling',
              enum: ['great', 'good', 'okay', 'struggling', 'crisis'],
            },
            note: {
              type: Type.STRING,
              description: 'Brief note about how they are feeling',
            },
          },
        },
      },
    ],
  },
];

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  residentId: string,
  sobrietyDate: Date | null | undefined
): Promise<Record<string, unknown>> {
  const now = new Date();

  if (toolName === 'get_sobriety_stats') {
    if (!sobrietyDate) return { message: 'No sobriety date set in profile' };
    const days = Math.floor((now.getTime() - sobrietyDate.getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return {
      daysSober: days,
      years,
      months,
      sobrietyDate: sobrietyDate.toISOString(),
    };
  }

  if (toolName === 'get_chore_status') {
    const enrollSnap = await adminDb
      .collectionGroup('enrollments')
      .where('residentId', '==', residentId)
      .where('status', '==', 'active')
      .get();
    const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];

    const choreResults = await Promise.all(
      tenantIds.map(tid =>
        adminDb
          .collection(`tenants/${tid}/chores`)
          .where('assigneeIds', 'array-contains', residentId)
          .where('status', 'in', ['pending', 'in_progress'])
          .get()
          .then(snap =>
            snap.docs.map(d => ({
              id: d.id,
              tenantId: tid,
              title: d.data().title,
              status: d.data().status,
              priority: d.data().priority,
              dueDate: d.data().dueDate?.toDate?.()?.toISOString() ?? null,
            }))
          )
      )
    );
    return { chores: choreResults.flat() };
  }

  if (toolName === 'get_upcoming_events') {
    const days = typeof args.days === 'number' ? args.days : 7;
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const enrollSnap = await adminDb
      .collectionGroup('enrollments')
      .where('residentId', '==', residentId)
      .where('status', '==', 'active')
      .get();
    const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];

    const eventResults = await Promise.all(
      tenantIds.map(tid =>
        adminDb
          .collection(`tenants/${tid}/events`)
          .where('scheduledAt', '>=', now)
          .where('scheduledAt', '<=', cutoff)
          .orderBy('scheduledAt', 'asc')
          .get()
          .then(snap =>
            snap.docs.map(d => ({
              id: d.id,
              tenantId: tid,
              title: d.data().title,
              scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(),
              location: d.data().location ?? null,
              type: d.data().type,
            }))
          )
      )
    );
    return { events: eventResults.flat() };
  }

  if (toolName === 'log_mood') {
    await adminDb.collection(`users/${residentId}/moods`).add({
      mood: args.mood,
      note: args.note,
      loggedAt: now,
    });
    return { success: true, message: 'Mood logged successfully' };
  }

  return { error: `Unknown tool: ${toolName}` };
}

export async function POST(request: NextRequest) {
  try {
    const { uid, appUser } = await verifyResidentToken(request);

    const body = await request.json();
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { message, conversationId } = parsed.data;
    const convId = conversationId ?? adminDb.collection('conversations').doc().id;

    // Build system prompt with resident context
    const systemParts = [
      `You are a compassionate AI recovery guide for ${appUser.displayName}.`,
      `You are deeply integrated with their sober living program and care about their wellbeing.`,
      appUser.sobrietyDate
        ? `They have been sober since ${appUser.sobrietyDate.toDateString()}.`
        : 'Their sobriety start date has not been set yet — encourage them to set it in their profile.',
      appUser.recoveryGoals?.length
        ? `Their recovery goals: ${appUser.recoveryGoals.join(', ')}.`
        : '',
      'You can look up their upcoming events, chore assignments, and sobriety stats using the tools available.',
      'Be encouraging, honest, and recovery-focused.',
      'Always refer them to their house manager or sponsor for clinical decisions.',
      'If they mention a crisis or thoughts of harm, provide crisis resources immediately (988 Suicide & Crisis Lifeline).',
    ]
      .filter(Boolean)
      .join(' ');

    // Load conversation history (last 20 messages)
    let history: Content[] = [];
    if (conversationId) {
      const messagesSnap = await adminDb
        .collection('conversations')
        .doc(convId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .limit(20)
        .get();

      history = messagesSnap.docs.map(doc => ({
        role: doc.data().role === 'user' ? 'user' : 'model',
        parts: [{ text: doc.data().content as string }],
      }));
    }

    // Initial request to Gemini
    const contents: Content[] = [...history, { role: 'user', parts: [{ text: message }] }];

    const response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemParts,
        tools: recoveryTools,
      },
    });

    let finalText = response.text ?? '';

    // Handle function calls if the model wants to use tools
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      // Execute all requested tool calls
      const toolResultParts: Part[] = await Promise.all(
        functionCalls.map(async (fc: FunctionCall) => {
          const result = await executeTool(
            fc.name!,
            (fc.args ?? {}) as Record<string, unknown>,
            appUser.residentId!,
            appUser.sobrietyDate
          );
          return {
            functionResponse: {
              name: fc.name!,
              response: result,
            },
          } as Part;
        })
      );

      // Send tool results back to Gemini for final response
      const followUpContents: Content[] = [
        ...contents,
        // Model's response with function calls
        { role: 'model', parts: response.candidates![0].content!.parts! },
        // Tool results
        { role: 'user', parts: toolResultParts },
      ];

      const followUp = await genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: followUpContents,
        config: { systemInstruction: systemParts },
      });

      finalText = followUp.text ?? '';
    }

    // Persist conversation and messages in a batch
    const batch = adminDb.batch();
    const convRef = adminDb.collection('conversations').doc(convId);
    batch.set(convRef, { userId: uid, updatedAt: new Date() }, { merge: true });

    const userMsgRef = convRef.collection('messages').doc();
    batch.set(userMsgRef, {
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    const assistantMsgRef = convRef.collection('messages').doc();
    batch.set(assistantMsgRef, {
      role: 'assistant',
      content: finalText,
      createdAt: new Date(),
    });

    await batch.commit();

    return NextResponse.json({ reply: finalText, conversationId: convId });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
