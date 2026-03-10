import { API_BASE_URL } from '../config';
import type {
    ContextSnapshot,
    ContextChore,
    ContextEvent,
    ContextCourse,
    ContextRide,
} from '../store/contextStore';
import { useContextStore } from '../store/contextStore';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Cache TTL: skip re-fetch if snapshot was loaded within 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;
/** Polling interval for chore updates (simulates real-time without Firestore SDK) */
const CHORE_POLL_MS = 2 * 60 * 1000;

// ─── Main Aggregator ──────────────────────────────────────────────────────────

/**
 * Builds a full ContextSnapshot for a user by calling mobile REST APIs in parallel.
 * Updates the Zustand context store upon success.
 *
 * Also starts a polling interval to keep chores "live" when assigned from the web app.
 * Returns a cleanup function to cancel the polling interval.
 */
export async function buildContextSnapshot(
    tenantId: string,
    getIdToken: () => Promise<string>
): Promise<() => void> {
    const { setSnapshot, setLoading, patchChores, snapshot } = useContextStore.getState();

    // Cache check — refresh is optional if snapshot is fresh
    if (snapshot && snapshot.tenantId === tenantId) {
        const age = Date.now() - new Date(snapshot.loadedAt).getTime();
        if (age < CACHE_TTL_MS) {
            // Set up polling even if using cached data
            return startChorePolling(tenantId, getIdToken, patchChores);
        }
    }

    setLoading(true);

    try {
        const token = await getIdToken();
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        // ── Parallel fetches ──────────────────────────────────────────────────────
        const [profileRes, feedRes, progressRes, ridesRes] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/api/mobile/users/me`, { headers }),
            fetch(`${API_BASE_URL}/api/mobile/users/me/feed`, { headers }),
            fetch(`${API_BASE_URL}/api/mobile/users/me/progress`, { headers }),
            fetch(`${API_BASE_URL}/api/mobile/tenants/${tenantId}/rides`, { headers }),
        ]);

        const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
            ? await profileRes.value.json() : null;
        const feed = feedRes.status === 'fulfilled' && feedRes.value.ok
            ? await feedRes.value.json() : null;
        const progress = progressRes.status === 'fulfilled' && progressRes.value.ok
            ? await progressRes.value.json() : null;
        const ridesData = ridesRes.status === 'fulfilled' && ridesRes.value.ok
            ? await ridesRes.value.json() : null;

        const appUser = profile?.user;
        const recoveryGoals: string[] = appUser?.recoveryGoals ?? [];

        // Derive employment context from goals (used for ride pre-fill)
        const employmentGoal = recoveryGoals.find((g: string) =>
            /employ|work|job/i.test(g)
        );

        // ── Map courses ───────────────────────────────────────────────────────────
        const activeCourses: ContextCourse[] = (progress?.courses?.items ?? [])
            .filter((c: { status: string }) => c.status !== 'COMPLETED')
            .map((c: {
                courseId: string; title: string; progress: number;
                status: string; completedLessons: number; totalLessons: number;
            }): ContextCourse => ({
                id: c.courseId, title: c.title, progress: c.progress,
                status: c.status, completedLessons: c.completedLessons,
                totalLessons: c.totalLessons,
            }));

        // ── Map events (upcoming only, max 5) ─────────────────────────────────────
        const now = new Date();
        const upcomingEvents: ContextEvent[] = (feed?.events ?? [])
            .filter((e: { scheduledAt: string }) => new Date(e.scheduledAt) > now)
            .slice(0, 5)
            .map((e: {
                id: string; title: string; scheduledAt: string;
                location?: string; type?: string;
            }): ContextEvent => ({
                id: e.id, title: e.title, scheduledAt: e.scheduledAt,
                location: e.location, type: e.type,
            }));

        // ── Map chores ────────────────────────────────────────────────────────────
        const chores: ContextChore[] = (feed?.chores ?? []).map((c: {
            id: string; title: string; status: string; dueDate?: string;
        }): ContextChore => ({
            id: c.id, title: c.title, status: c.status, dueDate: c.dueDate,
        }));

        // ── Map pending rides ─────────────────────────────────────────────────────
        const pendingRides: ContextRide[] = (ridesData?.rides ?? [])
            .filter((r: { status: string }) => ['requested', 'pending'].includes(r.status))
            .map((r: {
                id: string; destination: string; status: string; requestedAt: string;
            }): ContextRide => ({
                id: r.id, destination: r.destination, status: r.status,
                requestedAt: r.requestedAt,
            }));

        // ── Sensitive medical — isolated, never auto-sent to AI ───────────────────
        const medicalInfo = appUser?.medicalInfo;
        const medical = medicalInfo
            ? { allergies: medicalInfo.allergies ?? [], triggers: medicalInfo.triggers ?? [] }
            : undefined;

        const snap: ContextSnapshot = {
            displayName: appUser?.displayName ?? 'Friend',
            recoveryGoals,
            sobrietyStartDate: appUser?.sobrietyCleanSince ?? appUser?.sobrietyDate ?? null,
            employmentGoal,
            chores,
            upcomingEvents,
            activeCourses,
            lastCompletedLesson: undefined,
            recentIncidents: [],
            pendingRides,
            _medical: medical,
            loadedAt: new Date().toISOString(),
            tenantId,
        };

        setSnapshot(snap);
        return startChorePolling(tenantId, getIdToken, patchChores);
    } catch {
        setLoading(false);
        return () => { };
    }
}

// ─── Chore Polling (real-time substitute without Firestore SDK) ───────────────

function startChorePolling(
    tenantId: string,
    getIdToken: () => Promise<string>,
    patchChores: (chores: ContextChore[]) => void
): () => void {
    const poll = setInterval(async () => {
        try {
            const token = await getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/mobile/tenants/${tenantId}/chores`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const chores: ContextChore[] = (data.chores ?? []).map((c: {
                id: string; title: string; status: string; dueDate?: string;
            }): ContextChore => ({
                id: c.id, title: c.title, status: c.status, dueDate: c.dueDate,
            }));
            patchChores(chores);
        } catch {
            // Silently catch polling errors
        }
    }, CHORE_POLL_MS);

    return () => clearInterval(poll);
}

// ─── Privacy guard ────────────────────────────────────────────────────────────

/**
 * Returns true if the user's message is explicitly asking about their medical info,
 * allowing the caller to include `_medical` in the AI context.
 */
export function userAskedAboutMedical(message: string): boolean {
    return /allerg|trigger|medical|medication|my condition/i.test(message);
}
