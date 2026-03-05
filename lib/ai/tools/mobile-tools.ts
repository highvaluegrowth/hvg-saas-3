import { Type, Tool, FunctionCall, Part } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const residentTools: Tool[] = [
    {
        functionDeclarations: [
            // ── Sobriety & Wellness ──────────────────────────────────────────────
            {
                name: 'get_sobriety_stats',
                description: 'Get the resident\'s sobriety stats: days sober, months, years, and streak milestones',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'log_mood',
                description: 'Log a mood check-in for the resident with an optional note',
                parameters: {
                    type: Type.OBJECT,
                    required: ['mood', 'note'],
                    properties: {
                        mood: {
                            type: Type.STRING,
                            description: 'Current mood level',
                            enum: ['great', 'good', 'okay', 'struggling', 'crisis'],
                        },
                        note: { type: Type.STRING, description: 'Brief note about how they are feeling (can be empty string)' },
                    },
                },
            },
            {
                name: 'get_wellness_summary',
                description: 'Get a summary of recent mood check-ins (last 7 days) to show emotional trends',
                parameters: { type: Type.OBJECT, properties: {} },
            },

            // ── House & Chores ───────────────────────────────────────────────────
            {
                name: 'get_chore_status',
                description: 'Get all pending and in-progress chores currently assigned to the resident',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'get_upcoming_events',
                description: 'Get upcoming house events (meetings, groups, activities) for the resident',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        days: { type: Type.NUMBER, description: 'Number of days to look ahead (default 7, max 30)' },
                    },
                },
            },

            // ── Meetings & Recovery ──────────────────────────────────────────────
            {
                name: 'log_meeting_attendance',
                description: 'Log that the resident attended a 12-step or recovery meeting (AA, NA, SMART Recovery, etc.)',
                parameters: {
                    type: Type.OBJECT,
                    required: ['meetingType'],
                    properties: {
                        meetingType: {
                            type: Type.STRING,
                            description: 'Type of meeting attended',
                            enum: ['AA', 'NA', 'SMART Recovery', 'Celebrate Recovery', 'Al-Anon', 'Other'],
                        },
                        location: { type: Type.STRING, description: 'Where the meeting was held (optional)' },
                        notes: { type: Type.STRING, description: 'Any notes about the meeting (optional)' },
                    },
                },
            },
            {
                name: 'get_meeting_attendance',
                description: 'Get the resident\'s meeting attendance history and count for the past 30 days',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'find_aa_meetings',
                description: 'Find local AA or NA meetings near the resident. Returns finder links and resources.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        meetingType: {
                            type: Type.STRING,
                            description: 'Type of meeting to find',
                            enum: ['AA', 'NA', 'SMART Recovery', 'Any'],
                        },
                    },
                },
            },

            // ── Learning (LMS) ───────────────────────────────────────────────────
            {
                name: 'get_my_courses',
                description: 'Get courses the resident is enrolled in, including progress percentage and completion status',
                parameters: { type: Type.OBJECT, properties: {} },
            },

            // ── Journal ──────────────────────────────────────────────────────────
            {
                name: 'create_journal_entry',
                description: 'Save a private journal entry for the resident. Only they can see it.',
                parameters: {
                    type: Type.OBJECT,
                    required: ['content'],
                    properties: {
                        title: { type: Type.STRING, description: 'Optional title for the entry' },
                        content: { type: Type.STRING, description: 'The journal entry text' },
                        mood: {
                            type: Type.STRING,
                            description: 'Optional mood tag',
                            enum: ['great', 'good', 'okay', 'struggling', 'crisis'],
                        },
                    },
                },
            },
            {
                name: 'get_journal_entries',
                description: 'Retrieve the resident\'s most recent journal entries (last 5)',
                parameters: { type: Type.OBJECT, properties: {} },
            },

            // ── Crisis Resources ─────────────────────────────────────────────────
            {
                name: 'get_crisis_resources',
                description: 'Get immediate crisis resources and hotline numbers when a resident is struggling or in danger',
                parameters: { type: Type.OBJECT, properties: {} },
            },
        ],
    },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeResidentTool(
    toolName: string,
    args: Record<string, unknown>,
    residentId: string,
    sobrietyDate: Date | null | undefined
): Promise<Record<string, unknown>> {
    const now = new Date();

    // ── Sobriety Stats ───────────────────────────────────────────────────────
    if (toolName === 'get_sobriety_stats') {
        if (!sobrietyDate) return { message: 'No sobriety date set in profile. Encourage the resident to set it.' };
        const days = Math.floor((now.getTime() - sobrietyDate.getTime()) / (1000 * 60 * 60 * 24));
        const milestones = [30, 60, 90, 180, 365, 730, 1825].filter(m => days >= m);
        const nextMilestone = [30, 60, 90, 180, 365, 730, 1825].find(m => m > days);
        return {
            daysSober: days,
            years: Math.floor(days / 365),
            months: Math.floor((days % 365) / 30),
            sobrietyDate: sobrietyDate.toISOString(),
            achievedMilestones: milestones,
            nextMilestoneDays: nextMilestone ?? null,
            daysToNextMilestone: nextMilestone ? nextMilestone - days : null,
        };
    }

    // ── Log Mood ─────────────────────────────────────────────────────────────
    if (toolName === 'log_mood') {
        await adminDb.collection(`users/${residentId}/moods`).add({
            mood: args.mood,
            note: args.note ?? '',
            loggedAt: now,
        });
        return { success: true, message: `Mood "${args.mood}" logged successfully` };
    }

    // ── Wellness Summary (last 7 days of moods) ──────────────────────────────
    if (toolName === 'get_wellness_summary') {
        const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const snap = await adminDb.collection(`users/${residentId}/moods`)
            .where('loggedAt', '>=', since)
            .orderBy('loggedAt', 'desc')
            .limit(20)
            .get();
        const moods = snap.docs.map(d => ({ mood: d.data().mood, note: d.data().note, loggedAt: d.data().loggedAt?.toDate?.()?.toISOString() ?? null }));
        const counts = moods.reduce((acc: Record<string, number>, m) => { acc[m.mood] = (acc[m.mood] ?? 0) + 1; return acc; }, {});
        return { past7Days: moods, moodCounts: counts, totalEntries: moods.length };
    }

    // ── Chore Status ─────────────────────────────────────────────────────────
    if (toolName === 'get_chore_status') {
        const enrollSnap = await adminDb.collectionGroup('enrollments')
            .where('residentId', '==', residentId)
            .where('status', '==', 'active')
            .get();
        if (enrollSnap.empty) return { chores: [], message: 'No active enrollments found' };
        const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
        const results = await Promise.all(
            tenantIds.map(tid =>
                adminDb.collection(`tenants/${tid}/chores`)
                    .where('assigneeIds', 'array-contains', residentId)
                    .where('status', 'in', ['pending', 'in_progress'])
                    .get()
                    .then(snap => snap.docs.map(d => ({
                        id: d.id,
                        tenantId: tid,
                        title: d.data().title,
                        status: d.data().status,
                        priority: d.data().priority,
                        dueDate: d.data().dueDate?.toDate?.()?.toISOString() ?? null,
                    })))
            )
        );
        return { chores: results.flat() };
    }

    // ── Upcoming Events ──────────────────────────────────────────────────────
    if (toolName === 'get_upcoming_events') {
        const days = typeof args.days === 'number' ? Math.min(args.days, 30) : 7;
        const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const enrollSnap = await adminDb.collectionGroup('enrollments')
            .where('residentId', '==', residentId)
            .where('status', '==', 'active')
            .get();
        if (enrollSnap.empty) return { events: [] };
        const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
        const results = await Promise.all(
            tenantIds.map(tid =>
                adminDb.collection(`tenants/${tid}/events`)
                    .where('scheduledAt', '>=', now)
                    .where('scheduledAt', '<=', cutoff)
                    .orderBy('scheduledAt', 'asc')
                    .get()
                    .then(snap => snap.docs.map(d => ({
                        id: d.id,
                        tenantId: tid,
                        title: d.data().title,
                        scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString(),
                        location: d.data().location ?? null,
                        type: d.data().type,
                    })))
            )
        );
        return { events: results.flat(), lookAheadDays: days };
    }

    // ── Log Meeting Attendance ────────────────────────────────────────────────
    if (toolName === 'log_meeting_attendance') {
        await adminDb.collection(`users/${residentId}/meetingAttendance`).add({
            meetingType: args.meetingType,
            location: args.location ?? null,
            notes: args.notes ?? null,
            attendedAt: now,
        });
        return { success: true, message: `${args.meetingType} meeting attendance logged` };
    }

    // ── Get Meeting Attendance (last 30 days) ─────────────────────────────────
    if (toolName === 'get_meeting_attendance') {
        const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const snap = await adminDb.collection(`users/${residentId}/meetingAttendance`)
            .where('attendedAt', '>=', since)
            .orderBy('attendedAt', 'desc')
            .get();
        const meetings = snap.docs.map(d => ({
            meetingType: d.data().meetingType,
            location: d.data().location,
            notes: d.data().notes,
            attendedAt: d.data().attendedAt?.toDate?.()?.toISOString() ?? null,
        }));
        const countByType = meetings.reduce((acc: Record<string, number>, m) => {
            acc[m.meetingType] = (acc[m.meetingType] ?? 0) + 1;
            return acc;
        }, {});
        return { past30Days: meetings, totalCount: meetings.length, countByType };
    }

    // ── Find AA/NA Meetings ───────────────────────────────────────────────────
    if (toolName === 'find_aa_meetings') {
        const type = (args.meetingType as string) ?? 'Any';
        return {
            resources: [
                { name: 'AA Meeting Finder', url: 'https://www.aa.org/find-aa', description: 'Official AA meeting locator — search by city or zip' },
                { name: 'NA Meeting Finder', url: 'https://www.na.org/meetingsearch/', description: 'Official NA meeting search — filter by day and type' },
                { name: 'SMART Recovery', url: 'https://www.smartrecovery.org/community/calendar.php', description: 'SMART Recovery meeting calendar' },
                { name: 'In The Rooms (virtual)', url: 'https://www.intherooms.com/home/', description: 'Online recovery meetings available 24/7' },
            ].filter(r => type === 'Any' || r.name.toLowerCase().includes(type.toLowerCase()) || type === 'Any'),
            tip: 'You can also ask your house manager for meeting schedules in your area.',
        };
    }

    // ── My Courses (LMS Enrollments) ─────────────────────────────────────────
    if (toolName === 'get_my_courses') {
        const enrollSnap = await adminDb.collectionGroup('enrollments')
            .where('residentId', '==', residentId)
            .where('status', '==', 'active')
            .get();
        if (enrollSnap.empty) return { enrollments: [], message: 'Not enrolled in any houses yet' };
        const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
        const results = await Promise.all(
            tenantIds.map(async tid => {
                const lmsSnap = await adminDb.collection(`tenants/${tid}/enrollments`)
                    .where('userId', '==', residentId)
                    .get();
                return lmsSnap.docs.map(d => ({
                    courseId: d.data().courseId,
                    status: d.data().status,
                    progress: d.data().progress ?? 0,
                    completedLessons: (d.data().completedLessons ?? []).length,
                    enrolledAt: d.data().enrolledAt?.toDate?.()?.toISOString() ?? null,
                    completedAt: d.data().completedAt?.toDate?.()?.toISOString() ?? null,
                }));
            })
        );
        return { courses: results.flat() };
    }

    // ── Create Journal Entry ──────────────────────────────────────────────────
    if (toolName === 'create_journal_entry') {
        await adminDb.collection(`users/${residentId}/journal`).add({
            title: args.title ?? null,
            content: args.content,
            mood: args.mood ?? null,
            createdAt: now,
        });
        return { success: true, message: 'Journal entry saved privately' };
    }

    // ── Get Journal Entries (last 5) ──────────────────────────────────────────
    if (toolName === 'get_journal_entries') {
        const snap = await adminDb.collection(`users/${residentId}/journal`)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        const entries = snap.docs.map(d => ({
            id: d.id,
            title: d.data().title,
            content: d.data().content,
            mood: d.data().mood,
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
        }));
        return { entries };
    }

    // ── Crisis Resources ──────────────────────────────────────────────────────
    if (toolName === 'get_crisis_resources') {
        return {
            immediate: [
                { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', available: '24/7' },
                { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' },
                { name: 'SAMHSA Helpline', contact: '1-800-662-4357', available: '24/7 — substance abuse & mental health' },
            ],
            recovery: [
                { name: 'AA Helpline', contact: '1-800-839-1686', available: '24/7' },
                { name: 'NA Helpline', contact: '1-800-662-4357', available: '24/7' },
            ],
            message: 'Your house manager and sponsor are also here to support you. You are not alone.',
        };
    }

    return { error: `Unknown tool: ${toolName}` };
}
