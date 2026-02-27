import { Type, Tool, FunctionCall, Part } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';

export const residentTools: Tool[] = [
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

export async function executeResidentTool(
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
        if (enrollSnap.empty) return { chores: [] };
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
        if (enrollSnap.empty) return { events: [] };
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
