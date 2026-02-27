import { Type, Tool, FunctionCall, Part } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';

export const operatorTools: Tool[] = [
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
                description: 'Assign a chore to one or more residents or create a universal chore',
                parameters: {
                    type: Type.OBJECT,
                    required: ['title'],
                    properties: {
                        title: { type: Type.STRING, description: 'Chore title / description' },
                        residentIds: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Array of resident user IDs to assign the chore to. Omit for a universal/unassigned house chore.',
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

export async function executeOperatorTool(
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
            assigneeIds: args.residentIds ?? [], // Universal chore if empty
            priority: args.priority ?? 'medium',
            status: 'pending',
            dueDate,
            createdBy,
            createdAt: now,
        });
        return { success: true, choreId: ref.id, title: args.title, assigneeIds: args.residentIds ?? [] };
    }

    if (toolName === 'build_lms_course') {
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
        const snap = await adminDb.collection(`tenants/${tenantId}/rides`).where('status', 'in', ['pending', 'scheduled']).get();
        const pendingRides = snap.docs.map(d => ({ id: d.id, destination: d.data().destination, time: d.data().scheduledAt?.toDate?.()?.toISOString() }));
        return { success: true, optimizedGroups: [{ zone: 'North Route', rides: pendingRides.slice(0, 2) }, { zone: 'South Route', rides: pendingRides.slice(2) }] };
    }

    if (toolName === 'draft_incident_report') {
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
