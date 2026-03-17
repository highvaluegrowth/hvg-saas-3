import { Type, Tool } from '@google/genai';
import { adminDb } from '@/lib/firebase/admin';

export const clinicalTools: Tool[] = [
    {
        functionDeclarations: [
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
            {
                name: 'get_my_courses',
                description: 'Get courses the resident is enrolled in, including progress percentage and completion status',
                parameters: { type: Type.OBJECT, properties: {} },
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
            {
                name: 'get_crisis_resources',
                description: 'Get immediate crisis resources and hotline numbers when a resident is struggling or in danger',
                parameters: { type: Type.OBJECT, properties: {} },
            },
            {
                name: 'get_sobriety_stats',
                description: 'Get the resident\'s sobriety stats: days sober, months, years, and streak milestones',
                parameters: { type: Type.OBJECT, properties: {} },
            },
        ]
    }
];

export async function executeClinicalTool(
    toolName: string,
    args: Record<string, unknown>,
    context: { tenantId?: string; uid: string; sobrietyDate?: Date | null }
): Promise<Record<string, unknown>> {
    const { tenantId, uid, sobrietyDate } = context;
    const now = new Date();

    if (toolName === 'draft_incident_report') {
        if (!tenantId) return { error: 'Tenant context required' };
        const ref = adminDb.collection(`tenants/${tenantId}/incidents`).doc();
        await ref.set({
            summary: args.summary,
            incidentDate: args.incidentDate ? new Date(args.incidentDate as string) : now,
            involvedResidents: args.involvedResidents,
            status: 'review_pending',
            createdBy: uid,
            createdAt: now,
        });
        return { success: true, incidentId: ref.id, summarySnippet: (args.summary as string).substring(0, 50) + '...' };
    }

    if (toolName === 'log_mood') {
        await adminDb.collection(`users/${uid}/moods`).add({
            mood: args.mood,
            note: args.note ?? '',
            loggedAt: now,
        });
        return { success: true, message: `Mood "${args.mood}" logged successfully` };
    }

    if (toolName === 'get_wellness_summary') {
        const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const snap = await adminDb.collection(`users/${uid}/moods`)
            .where('loggedAt', '>=', since)
            .orderBy('loggedAt', 'desc')
            .limit(20)
            .get();
        const moods = snap.docs.map(d => ({ mood: d.data().mood, note: d.data().note, loggedAt: d.data().loggedAt?.toDate?.()?.toISOString() ?? null }));
        const counts = moods.reduce((acc: Record<string, number>, m) => { acc[m.mood] = (acc[m.mood] ?? 0) + 1; return acc; }, {});
        return { past7Days: moods, moodCounts: counts, totalEntries: moods.length };
    }

    if (toolName === 'log_meeting_attendance') {
        await adminDb.collection(`users/${uid}/meetingAttendance`).add({
            meetingType: args.meetingType,
            location: args.location ?? null,
            notes: args.notes ?? null,
            attendedAt: now,
        });
        return { success: true, message: `${args.meetingType} meeting attendance logged` };
    }

    if (toolName === 'get_meeting_attendance') {
        const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const snap = await adminDb.collection(`users/${uid}/meetingAttendance`)
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

    if (toolName === 'get_my_courses') {
        const enrollSnap = await adminDb.collectionGroup('enrollments')
            .where('residentId', '==', uid)
            .where('status', '==', 'active')
            .get();
        if (enrollSnap.empty) return { enrollments: [], message: 'Not enrolled in any houses yet' };
        const tenantIds = [...new Set(enrollSnap.docs.map(d => d.data().tenantId as string))];
        const results = await Promise.all(
            tenantIds.map(async tid => {
                const lmsSnap = await adminDb.collection(`tenants/${tid}/enrollments`)
                    .where('userId', '==', uid)
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

    if (toolName === 'build_lms_course') {
        if (!tenantId) return { error: 'Tenant context required' };
        const ref = adminDb.collection(`tenants/${tenantId}/courses`).doc();
        await ref.set({
            title: args.title,
            description: args.description,
            modules: args.modules,
            status: 'draft',
            createdBy: uid,
            createdAt: now,
        });
        return { success: true, courseId: ref.id, title: args.title, message: 'LMS Course drafted successfully' };
    }

    if (toolName === 'create_journal_entry') {
        await adminDb.collection(`users/${uid}/journal`).add({
            title: args.title ?? null,
            content: args.content,
            mood: args.mood ?? null,
            createdAt: now,
        });
        return { success: true, message: 'Journal entry saved privately' };
    }

    if (toolName === 'get_journal_entries') {
        const snap = await adminDb.collection(`users/${uid}/journal`)
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

    if (toolName === 'get_sobriety_stats') {
        if (!sobrietyDate) return { message: 'No sobriety date set in profile.' };
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

    return { error: `Unknown clinical tool: ${toolName}` };
}
