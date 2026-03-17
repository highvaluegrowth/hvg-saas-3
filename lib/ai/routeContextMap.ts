/**
 * Semantic UI Mapping
 * Defines the capabilities (actions, filters, and fields) available on specific views.
 * This allows HVG Outlet to "see" and "drive" the UI programmatically.
 */

export interface ViewCapability {
    description: string;
    actions: string[];
    filters?: string[];
    fields?: string[];
    suggestedPrompts?: string[];
}

const VIEW_MAPS: Record<string, ViewCapability> = {
    '/dashboard': {
        description: 'Main dashboard overview showing key metrics and recent activity.',
        actions: ['view_analytics', 'switch_tenant'],
        suggestedPrompts: ['Show me our current occupancy', 'What are the most urgent tasks today?']
    },
    '/events': {
        description: 'Calendar view of upcoming house and community events.',
        actions: ['create_event', 'edit_event', 'delete_event', 'filter_events'],
        filters: ['date_range', 'event_type', 'house_id'],
        fields: ['title', 'scheduledAt', 'location', 'description', 'visibility'],
        suggestedPrompts: ['Schedule a house meeting for tomorrow at 6 PM', 'Show me universal events for this week']
    },
    '/chores': {
        description: 'Board for managing and assigning resident chores.',
        actions: ['assign_chore', 'mark_chore_complete', 'delete_chore'],
        filters: ['status', 'priority', 'resident_id'],
        fields: ['title', 'description', 'priority', 'dueDate', 'assigneeIds'],
        suggestedPrompts: ['Assign bathroom cleaning to John Doe', 'Show me all overdue chores']
    },
    '/residents': {
        description: 'Directory of all residents enrolled in the organization.',
        actions: ['add_resident', 'view_profile', 'discharge_resident'],
        filters: ['status', 'house_id', 'phase'],
        fields: ['name', 'email', 'phone', 'sobrietyDate', 'status'],
        suggestedPrompts: ['Find residents in Phase 1', 'Add a new resident named Jane Smith']
    },
    '/houses': {
        description: 'Management interface for properties, rooms, and beds.',
        actions: ['add_house', 'edit_house', 'manage_rooms', 'assign_bed'],
        filters: ['status', 'city'],
        fields: ['name', 'address', 'capacity', 'managerId'],
        suggestedPrompts: ['Show me houses with open beds', 'Which house is at full capacity?']
    },
    '/incidents': {
        description: 'Log of incident reports and clinical documentation.',
        actions: ['draft_incident_report', 'view_incident', 'resolve_incident'],
        filters: ['status', 'severity', 'resident_id'],
        fields: ['summary', 'incidentDate', 'involvedResidents', 'status'],
        suggestedPrompts: ['Draft an incident report for last night', 'Show me pending incident reviews']
    },
    '/rides': {
        description: 'Transportation management and ride requests.',
        actions: ['request_ride', 'optimize_transport_routes', 'assign_driver'],
        filters: ['status', 'date'],
        fields: ['destination', 'requestedAt', 'residentId', 'notes'],
        suggestedPrompts: ['Optimize our morning routes', 'Is there a ride scheduled for Peter at 3 PM?']
    }
};

/**
 * Returns the semantic capability map for a given pathname.
 */
export function getSemanticContext(pathname: string): ViewCapability {
    const normalized = pathname.replace(/^\/[^/]+/, '') || '/dashboard';

    // Exact match
    if (VIEW_MAPS[normalized]) return VIEW_MAPS[normalized];

    // Dynamic Route Handlers
    if (normalized.startsWith('/residents/')) {
        return {
            description: 'Individual resident profile view with history and metrics.',
            actions: ['edit_profile', 'log_mood', 'view_history', 'assign_chore'],
            fields: ['name', 'sobrietyDate', 'phase', 'emergencyContact'],
            suggestedPrompts: ['When did they move in?', 'Log a positive mood for this resident']
        };
    }

    if (normalized.startsWith('/lms/') && normalized.includes('/builder')) {
        return {
            description: 'Curriculum builder for designing courses and modules.',
            actions: ['add_module', 'add_lesson', 'save_curriculum', 'publish_course'],
            fields: ['title', 'description', 'modules'],
            suggestedPrompts: ['Add a module for Relapse Prevention', 'Draft a quiz for the introduction']
        };
    }

    // Default Fallback
    return {
        description: 'Standard HVG platform interface.',
        actions: ['navigate', 'ask_question'],
        suggestedPrompts: ['What can I do here?', 'Help me find my way around']
    };
}

// Keep legacy export for backward compatibility during migration if needed
export function getRouteContext(pathname: string): string {
    const ctx = getSemanticContext(pathname);
    return `VIEW CONTEXT: ${ctx.description}
AVAILABLE ACTIONS: ${ctx.actions.join(', ')}
${ctx.filters ? `FILTERS PRESENT: ${ctx.filters.join(', ')}` : ''}
${ctx.fields ? `DATA FIELDS: ${ctx.fields.join(', ')}` : ''}`;
}
