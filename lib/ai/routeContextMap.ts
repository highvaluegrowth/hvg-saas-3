/**
 * Maps current pathname to a concise context string injected into the Gemini system prompt.
 * Allows the AI to be contextually aware of the page the user is viewing.
 */
export function getRouteContext(pathname: string): string {
    // Strip the leading tenantId segment: /abc123/events → /events
    const normalized = pathname.replace(/^\/[^/]+/, '') || '/dashboard';

    const exact: Record<string, string> = {
        '/dashboard': 'The user is on the main dashboard overview.',
        '/': 'The user is on the main dashboard overview.',
        '/events': 'The user is viewing the Events calendar. Upcoming events and scheduling are relevant.',
        '/chores': 'The user is on the Chores board. Pending chore assignments are relevant. Offer to assign pending chores or review completion.',
        '/incidents': 'The user is on the Incident Log. Recent incident reports may be relevant. Offer to draft a structured report.',
        '/rides': 'The user is on the Transportation page. Active and pending ride requests are relevant. Offer to optimize transport routes.',
        '/houses': 'The user is managing house properties and bed assignments.',
        '/lms': 'The user is browsing the LMS course library. Offer to scaffold a new course.',
        '/join-requests': 'The user is reviewing new resident join requests.',
        '/staff': 'The user is managing staff members.',
    };

    // Exact match first
    if (exact[normalized]) return exact[normalized];

    // Prefix matches (for sub-routes like /lms/[courseId]/builder)
    if (normalized.startsWith('/lms/') && normalized.includes('/builder')) {
        return 'The user is in the Course Builder, actively editing lesson content. Help with scaffolding modules or drafting content.';
    }
    if (normalized.startsWith('/lms/')) {
        return 'The user is viewing a specific LMS course. Course details and lesson progress are relevant.';
    }
    if (normalized.startsWith('/events/')) {
        return 'The user is viewing event details. The event title, location, and schedule are relevant.';
    }
    if (normalized.startsWith('/residents/')) {
        return 'The user is viewing a resident profile. Resident history and status are relevant.';
    }

    return 'The user is in the HVG dashboard.';
}
