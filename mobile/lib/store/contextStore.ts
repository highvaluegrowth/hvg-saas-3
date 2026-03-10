import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContextChore {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
}

export interface ContextEvent {
    id: string;
    title: string;
    scheduledAt: string;
    location?: string;
    type?: string;
}

export interface ContextCourse {
    id: string;
    title: string;
    progress: number; // 0–100
    status: string;
    completedLessons: number;
    totalLessons: number;
}

export interface ContextIncident {
    id: string;
    type: string;
    severity: string;
    reportedAt: string;
}

export interface ContextRide {
    id: string;
    destination: string;
    status: string;
    requestedAt: string;
}

export interface ContextSnapshot {
    // Profile
    displayName: string;
    recoveryGoals: string[];
    sobrietyStartDate: string | null;
    employmentGoal?: string;      // derived from goals — used for ride pre-fill

    // House data (real-time via Firestore onSnapshot)
    chores: ContextChore[];
    upcomingEvents: ContextEvent[];

    // Academic
    activeCourses: ContextCourse[];
    lastCompletedLesson?: string;

    // Compliance — sensitive; NOT sent to AI unless asked
    recentIncidents: ContextIncident[];
    pendingRides: ContextRide[];

    // Medical — NEVER sent to AI system context automatically
    _medical?: {
        allergies?: string[];
        triggers?: string[];
    };

    // Meta
    loadedAt: string;    // ISO timestamp for cache invalidation
    tenantId: string | null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ContextState {
    snapshot: ContextSnapshot | null;
    isLoading: boolean;
    setSnapshot: (snap: ContextSnapshot) => void;
    clearSnapshot: () => void;
    setLoading: (v: boolean) => void;
    /** Patch chores only (called by real-time listener) */
    patchChores: (chores: ContextChore[]) => void;
}

export const useContextStore = create<ContextState>((set) => ({
    snapshot: null,
    isLoading: false,

    setSnapshot: (snap) => set({ snapshot: snap, isLoading: false }),
    clearSnapshot: () => set({ snapshot: null }),
    setLoading: (v) => set({ isLoading: v }),

    patchChores: (chores) =>
        set((state) =>
            state.snapshot
                ? { snapshot: { ...state.snapshot, chores } }
                : state
        ),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Returns the context as a structured JSON string for the AI system message.
 *  ⚠️  Sensitive medical fields are EXCLUDED unless `includeMedical` is true. */
export function buildAISystemContext(
    snap: ContextSnapshot,
    includeMedical = false
): string {
    const context = {
        user: {
            name: snap.displayName,
            recoveryGoals: snap.recoveryGoals,
            sobrietyStartDate: snap.sobrietyStartDate,
        },
        house: {
            assignedChores: snap.chores,
            upcomingEvents: snap.upcomingEvents,
        },
        academic: {
            activeCourses: snap.activeCourses,
            lastCompletedLesson: snap.lastCompletedLesson,
        },
        compliance: {
            recentIncidents: snap.recentIncidents,
            pendingRides: snap.pendingRides,
        },
        ...(includeMedical && snap._medical
            ? { medical: snap._medical }
            : {}),
    };

    return JSON.stringify(context, null, 2);
}

/** Returns a human-readable proactive greeting based on context. */
export function buildProactiveGreeting(snap: ContextSnapshot): string {
    const name = snap.displayName.split(' ')[0] || 'there';
    const parts: string[] = [];

    // Next upcoming event
    const nextEvent = snap.upcomingEvents[0];
    if (nextEvent) {
        const time = new Date(nextEvent.scheduledAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
        parts.push(`I see you have **${nextEvent.title}** at ${time}`);
    }

    // Most in-progress course
    const inProgressCourse = snap.activeCourses
        .filter((c) => c.progress > 0 && c.progress < 100)
        .sort((a, b) => b.progress - a.progress)[0];
    if (inProgressCourse) {
        parts.push(
            `your **'${inProgressCourse.title}'** course is ${inProgressCourse.progress}% done`
        );
    }

    // Pending chores
    const pendingCount = snap.chores.filter(
        (c) => c.status === 'pending' || c.status === 'in_progress'
    ).length;
    if (pendingCount > 0 && !nextEvent && !inProgressCourse) {
        parts.push(`you have ${pendingCount} chore${pendingCount > 1 ? 's' : ''} to complete`);
    }

    if (parts.length === 0) {
        return `Hi, ${name}! I'm your HVG Guide — here to support your recovery journey. Ask me anything!`;
    }

    const joined = parts.length === 1
        ? parts[0]
        : parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];

    return `Hey ${name}! 🌱 I see ${joined}. How can I help you today?`;
}
