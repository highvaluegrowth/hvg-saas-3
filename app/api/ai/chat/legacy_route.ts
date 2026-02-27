import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAppUserToken } from '@/lib/middleware/residentAuthMiddleware';
import { adminDb } from '@/lib/firebase/admin';
import { genai, GEMINI_MODEL } from '@/lib/ai/gemini';
import { Type } from '@google/genai';
import type { Content, FunctionCall, Part, Tool } from '@google/genai';

const ChatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  routeContext: z.string().optional(),   // e.g. "User is on the Events calendar"
  persona: z.enum(['recovery', 'operator']).optional(),
});

// ─── RESIDENT TOOLS ────────────────────────────────────────────────
const residentTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_upcoming_events',
        description: 'Get upcoming events for the resident across all their enrolled organizations',
        parameters: {
          type: Type.OBJECT,
          properties: {
            days: { type: Type.NUMBER, description: 'Number of days to look ahead (default 7)' },
          },
        },
      },
      {
        name: 'get_chore_status',
        description: 'Get current chores assigned to the resident',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'get_sobriety_stats',
        description: 'Get sobriety stats for the resident based on their sobrietyDate',
        parameters: { type: Type.OBJECT, properties: {} },
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
            note: { type: Type.STRING, description: 'Brief note about how they are feeling' },
          },
        },
      },
    ],
  },
];

// ─── OPERATOR TOOLS ────────────────────────────────────────────────
const operatorTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_upcoming_events',
        description: 'Get upcoming events for the tenant',
        parameters: {
          type: Type.OBJECT,
          properties: {
            days: { type: Type.NUMBER, description: 'Number of days to look ahead (default 7)' },
          },
        },
      },
      {
        name: 'get_pending_chores',
        description: 'Get all pending or in-progress chores across all residents in the house',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'get_ride_requests',
        description: 'Get all pending or scheduled ride requests for the tenant',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'get_join_requests',
        description: 'Get pending resident join/application requests awaiting approval',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'create_event',
        description: 'Create a new event in the tenant calendar',
        parameters: {
          type: Type.OBJECT,
          required: ['title', 'scheduledAt'],
          properties: {
            title: { type: Type.STRING, description: 'Event title' },
            scheduledAt: { type: Type.STRING, description: 'ISO 8601 date-time string' },
            location: { type: Type.STRING, description: 'Event location (optional)' },
            description: { type: Type.STRING, description: 'Event description (optional)' },
          },
        },
      },
      {
        name: 'assign_chore',
        description: 'Assign a chore to one or more residents',
        parameters: {
          type: Type.OBJECT,
          required: ['title', 'residentIds'],
          properties: {
            title: { type: Type.STRING, description: 'Chore title / description' },
            residentIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of resident user IDs to assign the chore to',
            },
            priority: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high'],
              description: 'Chore priority (default: medium)',
            },
            dueDate: { type: Type.STRING, description: 'ISO 8601 due date (optional)' },
          },
        },
      },
      {
        name: 'build_lms_course',
        description: 'Draft, structure, and save a new LMS course module directly to the courses collection',
        parameters: {
          type: Type.OBJECT,
          required: ['title', 'description', 'modules'],
          properties: {
            title: { type: Type.STRING, description: 'Course title' },
            description: { type: Type.STRING, description: 'Course description' },
            modules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of module titles to be created within the course',
            },
          },
        },
      },
      {
        name: 'optimize_transport_routes',
        description: 'Fetch pending ride requests and group them by proximity/time to optimize daily itineraries',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'draft_incident_report',
        description: 'Generate a formal, structured incident report from conversational shorthand inputs',
        parameters: {
          type: Type.OBJECT,
          required: ['summary', 'incidentDate', 'involvedResidents'],
          properties: {
            summary: { type: Type.STRING, description: 'Detailed formal summary expanding on the shorthand inputs' },
            incidentDate: { type: Type.STRING, description: 'ISO 8601 date of the incident' },
            involvedResidents: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of resident IDs or names involved',
            },
          },
        },
      },
    ],
  },
];

// ─── TOOL EXECUTORS ────────────────────────────────────────────────

async function executeResidentTool(
  toolName: string,
  args: Record<string, unknown>,
  residentId: string,
  sobrietyDate: Date | null | undefined
): Promise<Record<string, unknown>> {
  const now = new Date();

  if (toolName === 'get_sobriety_stats') {
    if (!sobrietyDate) return { message: 'No sobriety date set in profile' };
    const days = Math.floor((now.getTime() - sobrietyDate.getTime()) / (1000 * 60 * 60 * 24));
    return { daysSober: days, years: Math.floor(days / 365), months: Math.floor((days % 365) / 30), sobrietyDate: sobrietyDate.toISOString() };
  }

  if (toolName === 'get_chore_status') {
    const enrollSnap = await adminDb.collectionGroup('enrollments').where('residentId', '==', residentId).where('status', '==', 'active').get();
    const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
    const results = await Promise.all(
      tenantIds.map(tid =>
        adminDb.collection(`tenants/${tid}/chores`).where('assigneeIds', 'array-contains', residentId).where('status', 'in', ['pending', 'in_progress']).get()
          .then(snap => snap.docs.map(d => ({ id: d.id, tenantId: tid, title: d.data().title, status: d.data().status, priority: d.data().priority, dueDate: d.data().dueDate?.toDate?.()?.toISOString() ?? null })))
      )
    );
    return { chores: results.flat() };
  }

  if (toolName === 'get_upcoming_events') {
    const days = typeof args.days === 'number' ? args.days : 7;
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const enrollSnap = await adminDb.collectionGroup('enrollments').where('residentId', '==', residentId).where('status', '==', 'active').get();
    const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
    const results = await Promise.all(
      tenantIds.map(tid =>
        adminDb.collection(`tenants/${tid}/events`).where('scheduledAt', '>=', now).where('scheduledAt', '<=', cutoff).orderBy('scheduledAt', 'asc').get()
          .then(snap => snap.docs.map(d => ({ id: d.id, tenantId: tid, title: d.data().title, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), location: d.data().location ?? null, type: d.data().type })))
      )
    );
    return { events: results.flat() };
  }

  if (toolName === 'log_mood') {
    await adminDb.collection(`users/${residentId}/moods`).add({ mood: args.mood, note: args.note, loggedAt: now });
    return { success: true, message: 'Mood logged successfully' };
  }

  return { error: `Unknown tool: ${toolName}` };
}

async function executeOperatorTool(
  toolName: string,
  args: Record<string, unknown>,
  tenantId: string,
  createdBy: string
): Promise<Record<string, unknown>> {
  const now = new Date();

  if (toolName === 'get_upcoming_events') {
    const days = typeof args.days === 'number' ? args.days : 7;
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const snap = await adminDb.collection(`tenants/${tenantId}/events`).where('scheduledAt', '>=', now).where('scheduledAt', '<=', cutoff).orderBy('scheduledAt', 'asc').get();
    return { events: snap.docs.map(d => ({ id: d.id, title: d.data().title, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), location: d.data().location ?? null })) };
  }

  if (toolName === 'get_pending_chores') {
    const snap = await adminDb.collection(`tenants/${tenantId}/chores`).where('status', 'in', ['pending', 'in_progress']).get();
    return { chores: snap.docs.map(d => ({ id: d.id, title: d.data().title, status: d.data().status, priority: d.data().priority, assigneeIds: d.data().assigneeIds ?? [] })) };
  }

  if (toolName === 'get_ride_requests') {
    const snap = await adminDb.collection(`tenants/${tenantId}/rides`).where('status', 'in', ['pending', 'scheduled']).get();
    return { rides: snap.docs.map(d => ({ id: d.id, residentId: d.data().residentId, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), destination: d.data().destination, status: d.data().status })) };
  }

  if (toolName === 'get_join_requests') {
    const snap = await adminDb.collection(`tenants/${tenantId}/joinRequests`).where('status', '==', 'pending').get();
    return { requests: snap.docs.map(d => ({ id: d.id, name: d.data().displayName, email: d.data().email, submittedAt: d.data().createdAt?.toDate?.()?.toISOString() })) };
  }

  if (toolName === 'create_event') {
    const ref = adminDb.collection(`tenants/${tenantId}/events`).doc();
    const scheduledAt = new Date(args.scheduledAt as string);
    await ref.set({
      title: args.title,
      scheduledAt,
      location: args.location ?? null,
      description: args.description ?? null,
      createdBy,
      createdAt: now,
      type: 'general',
    });
    return { success: true, eventId: ref.id, title: args.title, scheduledAt: scheduledAt.toISOString() };
  }

  if (toolName === 'assign_chore') {
    const ref = adminDb.collection(`tenants/${tenantId}/chores`).doc();
    const dueDate = args.dueDate ? new Date(args.dueDate as string) : null;
    await ref.set({
      title: args.title,
      assigneeIds: args.residentIds,
      priority: args.priority ?? 'medium',
      status: 'pending',
      dueDate,
      createdBy,
      createdAt: now,
    });
    return { success: true, choreId: ref.id, title: args.title, assigneeIds: args.residentIds };
  }

  if (toolName === 'build_lms_course') {
    // Scaffold functionality: Create course shell in Firestore
    const ref = adminDb.collection(`tenants/${tenantId}/courses`).doc();
    await ref.set({
      title: args.title,
      description: args.description,
      modules: args.modules,
      status: 'draft',
      createdBy,
      createdAt: now,
    });
    return { success: true, courseId: ref.id, title: args.title, message: 'LMS Course drafted successfully' };
  }

  if (toolName === 'optimize_transport_routes') {
    // Scaffold functionality: Return dummy optimized itinerary based on pending rides
    const snap = await adminDb.collection(`tenants/${tenantId}/rides`).where('status', 'in', ['pending', 'scheduled']).get();
    const pendingRides = snap.docs.map(d => ({ id: d.id, destination: d.data().destination, time: d.data().scheduledAt?.toDate?.()?.toISOString() }));
    return { success: true, optimizedGroups: [{ zone: 'North Route', rides: pendingRides.slice(0, 2) }, { zone: 'South Route', rides: pendingRides.slice(2) }] };
  }

  if (toolName === 'draft_incident_report') {
    // Scaffold functionality: Save formal incident report
    const ref = adminDb.collection(`tenants/${tenantId}/incidents`).doc();
    await ref.set({
      summary: args.summary,
      incidentDate: args.incidentDate ? new Date(args.incidentDate as string) : now,
      involvedResidents: args.involvedResidents,
      status: 'review_pending',
      createdBy,
      createdAt: now,
    });
    return { success: true, incidentId: ref.id, summarySnippet: (args.summary as string).substring(0, 50) + '...' };
  }

  return { error: `Unknown operator tool: ${toolName}` };
}

// ─── SYSTEM PROMPTS ────────────────────────────────────────────────

function buildResidentSystemPrompt(appUser: { displayName?: string; sobrietyDate?: Date | null; recoveryGoals?: string[] }, routeContext?: string): string {
  return [
    `You are the HVG Agent, acting as a warm, humanist Recovery Program Guide for ${appUser.displayName ?? 'this resident'}.`,
    `You are deeply integrated with their sober living program. You care about their wellbeing. Avoid clinical, cold, or overly robotic language.`,
    appUser.sobrietyDate
      ? `They have been sober since ${appUser.sobrietyDate.toDateString()}.`
      : 'Their sobriety start date has not been set — encourage them to set it in their profile.',
    appUser.recoveryGoals?.length
      ? `Their recovery goals: ${appUser.recoveryGoals.join(', ')}.`
      : '',
    routeContext ? `Current page context: ${routeContext}` : '',
    'You can look up their upcoming events, chore assignments, and sobriety stats using the tools available.',
    'Be encouraging, honest, and recovery-focused.',
    'Always refer them to their house manager or sponsor for clinical decisions.',
    'If they mention a crisis or thoughts of harm, provide crisis resources immediately (988 Suicide & Crisis Lifeline).',
  ].filter(Boolean).join(' ');
}

function buildOperatorSystemPrompt(appUser: { displayName?: string; role?: string }, tenantId: string, routeContext?: string): string {
  return [
    `You are the HVG Agent, acting as a House Operations & Program Architect for ${appUser.displayName ?? 'this operator'}, a ${appUser.role ?? 'house manager'} at their sober living organization.`,
    `Your goal is to be structured, insightful, and anticipate workflow bottlenecks before they happen.`,
    `You help them manage their house efficiently — events, chores, transportation, resident join requests, course building, formatting incident reports, and extracting operational insights.`,
    `Their tenantId is: ${tenantId}.`,
    routeContext ? `Current page context: ${routeContext}` : '',
    'You can retrieve pending chores, upcoming events, ride requests, and join requests using the tools available.',
    'You can also create new events, assign chores, scaffold LMS courses, and draft formal incident reports.',
    'Be concise, professional, action-oriented, and highly analytical.',
    'For sensitive resident health decisions, defer to clinical staff.',
  ].filter(Boolean).join(' ');
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { uid, appUser, decodedToken } = await verifyAppUserToken(request);

    const body = await request.json();
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { message, conversationId, routeContext } = parsed.data;

    const isOperator = decodedToken.role && ['admin', 'house_manager', 'staff', 'super_admin'].includes(decodedToken.role);
    const persona = isOperator ? 'operator' : 'recovery';

    // If Operator, prioritize decodedToken.tenantId, otherwise check their JIT profile's first tenantId
    const tenantId = isOperator ? (decodedToken.tenantId as string) || appUser.tenantIds?.[0] : undefined;
    const convId = conversationId ?? adminDb.collection('conversations').doc().id;

    // Build system prompt based on role
    const systemPrompt = isOperator
      ? buildOperatorSystemPrompt({ displayName: appUser.displayName, role: decodedToken.role as string }, tenantId || 'none', routeContext)
      : buildResidentSystemPrompt(appUser, routeContext);

    const tools = isOperator ? operatorTools : residentTools;

    // Load conversation history (last 20 messages)
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

    const response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: systemPrompt, tools },
    });

    let finalText = response.text ?? '';
    let componentName: string | undefined;
    let componentData: unknown;

    // Handle function calls
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      // Only process the first function call for the UI component
      const primaryFc = functionCalls[0];
      componentName = primaryFc.name;

      const toolResultParts: Part[] = await Promise.all(
        functionCalls.map(async (fc: FunctionCall) => {
          const toolArgs = (fc.args ?? {}) as Record<string, unknown>;
          const result = isOperator
            ? await executeOperatorTool(fc.name!, toolArgs, tenantId || '', uid)
            : await executeResidentTool(fc.name!, toolArgs, appUser.residentId ?? uid, appUser.sobrietyDate);

          if (fc.name === primaryFc.name) {
            componentData = result;
          }

          return {
            functionResponse: { name: fc.name!, response: result },
          } as Part;
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
        config: { systemInstruction: systemPrompt },
      });

      finalText = followUp.text ?? '';
    }

    // Persist to Firestore
    const batch = adminDb.batch();
    const convRef = adminDb.collection('conversations').doc(convId);

    const convData: any = { userId: uid, persona, updatedAt: new Date() };
    if (tenantId) convData.tenantId = tenantId;
    batch.set(convRef, convData, { merge: true });

    const userMsgRef = convRef.collection('messages').doc();
    batch.set(userMsgRef, { role: 'user', content: message, createdAt: new Date() });

    const assistantMsgRef = convRef.collection('messages').doc();
    const assistantPayload: any = { role: 'assistant', content: finalText, createdAt: new Date() };
    if (componentName && componentData) {
      assistantPayload.component = componentName;
      assistantPayload.componentData = componentData;
    }
    batch.set(assistantMsgRef, assistantPayload);

    await batch.commit();

    return NextResponse.json({
      reply: finalText,
      conversationId: convId,
      persona,
      component: componentName,
      componentData
    });
  } catch (error: unknown) {
    const e = error as { message?: string; statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
