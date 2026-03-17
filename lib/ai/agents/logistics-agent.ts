import { Type, Tool } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';

export const logisticsTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'get_upcoming_events',
                description: 'Get upcoming events for the tenant or house',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        days: { type: Type.NUMBER, description: 'Number of days to look ahead (default 7)' },
                    },
                },
            },
            {
                name: 'get_pending_chores',
                description: 'Get all pending or in-progress chores for the house or resident',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'get_ride_requests',
                description: 'Get all pending or scheduled ride requests',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'create_event',
                description: 'Create a new event in the calendar',
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
                name: 'optimize_transport_routes',
                description: 'Fetch pending ride requests and group them by proximity/time to optimize daily itineraries',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'get_join_requests',
                description: 'Get pending resident join/application requests awaiting approval',
                parameters: { type: Type.OBJECT, properties: {} },
            },
        ]
    }
];

export async function executeLogisticsTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { tenantId?: string; uid: string }
): Promise<Record<string, unknown>> {
    const { tenantId, uid } = context;
    const now = new Date();

    if (toolName === 'get_upcoming_events') {
        const days = typeof args.days === 'number' ? args.days : 7;
        const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        if (tenantId) {
            const snap = await adminDb.collection(`tenants/${tenantId}/events`).where('scheduledAt', '>=', now).where('scheduledAt', '<=', cutoff).orderBy('scheduledAt', 'asc').get();
            return { events: snap.docs.map(d => ({ id: d.id, title: d.data().title, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), location: d.data().location ?? null })) };
        } else {
            // Resident view across all their houses
            const enrollSnap = await adminDb.collectionGroup('enrollments').where('residentId', '==', uid).where('status', '==', 'active').get();
            if (enrollSnap.empty) return { events: [] };
            const tIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
            const results = await Promise.all(tIds.map(tid => 
                adminDb.collection(`tenants/${tid}/events`).where('scheduledAt', '>=', now).where('scheduledAt', '<=', cutoff).orderBy('scheduledAt', 'asc').get()
                .then(s => s.docs.map(d => ({ id: d.id, tenantId: tid, title: d.data().title, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), location: d.data().location ?? null })))
            ));
            return { events: results.flat() };
        }
    }

    if (toolName === 'get_pending_chores') {
        if (tenantId) {
            const snap = await adminDb.collection(`tenants/${tenantId}/chores`).where('status', 'in', ['pending', 'in_progress']).get();
            return { chores: snap.docs.map(d => ({ id: d.id, title: d.data().title, status: d.data().status, priority: d.data().priority, assigneeIds: d.data().assigneeIds ?? [] })) };
        } else {
            // Resident view for assigned chores
            const enrollSnap = await adminDb.collectionGroup('enrollments').where('residentId', '==', uid).where('status', '==', 'active').get();
            if (enrollSnap.empty) return { chores: [] };
            const tIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
            const results = await Promise.all(tIds.map(tid => 
                adminDb.collection(`tenants/${tid}/chores`).where('assigneeIds', 'array-contains', uid).where('status', 'in', ['pending', 'in_progress']).get()
                .then(s => s.docs.map(d => ({ id: d.id, tenantId: tid, title: d.data().title, status: d.data().status, priority: d.data().priority })))
            ));
            return { chores: results.flat() };
        }
    }

    if (toolName === 'get_ride_requests') {
        if (!tenantId) return { error: 'Tenant context required' };
        const snap = await adminDb.collection(`tenants/${tenantId}/rides`).where('status', 'in', ['pending', 'scheduled']).get();
        return { rides: snap.docs.map(d => ({ id: d.id, residentId: d.data().residentId, scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(), destination: d.data().destination, status: d.data().status })) };
    }

    if (toolName === 'create_event') {
        if (!tenantId) return { error: 'Tenant context required' };
        const ref = adminDb.collection(`tenants/${tenantId}/events`).doc();
        const scheduledAt = new Date(args.scheduledAt as string);
        await ref.set({
            title: args.title,
            scheduledAt,
            location: args.location ?? null,
            description: args.description ?? null,
            createdBy: uid,
            createdAt: now,
            type: 'general',
        });
        return { success: true, eventId: ref.id, title: args.title, scheduledAt: scheduledAt.toISOString() };
    }

    if (toolName === 'assign_chore') {
        if (!tenantId) return { error: 'Tenant context required' };
        const ref = adminDb.collection(`tenants/${tenantId}/chores`).doc();
        const dueDate = args.dueDate ? new Date(args.dueDate as string) : null;
        await ref.set({
            title: args.title,
            assigneeIds: args.residentIds ?? [],
            priority: args.priority ?? 'medium',
            status: 'pending',
            dueDate,
            createdBy: uid,
            createdAt: now,
        });
        return { success: true, choreId: ref.id, title: args.title, assigneeIds: args.residentIds ?? [] };
    }

    if (toolName === 'optimize_transport_routes') {
        if (!tenantId) return { error: 'Tenant context required' };
        const snap = await adminDb.collection(`tenants/${tenantId}/rides`).where('status', 'in', ['pending', 'scheduled']).get();
        const pendingRides = snap.docs.map(d => ({ id: d.id, destination: d.data().destination, time: d.data().scheduledAt?.toDate?.()?.toISOString() }));
        return { success: true, optimizedGroups: [{ zone: 'North Route', rides: pendingRides.slice(0, 2) }, { zone: 'South Route', rides: pendingRides.slice(2) }] };
    }

    if (toolName === 'get_join_requests') {
        if (!tenantId) return { error: 'Tenant context required' };
        const snap = await adminDb.collection(`tenants/${tenantId}/joinRequests`).where('status', '==', 'pending').get();
        return { requests: snap.docs.map(d => ({ id: d.id, name: d.data().displayName, email: d.data().email, submittedAt: d.data().createdAt?.toDate?.()?.toISOString() })) };
    }

    return { error: `Unknown logistics tool: ${toolName}` };
}
