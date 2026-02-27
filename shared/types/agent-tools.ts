/**
 * HVG Agent Tool Definitions
 * Purpose: Provides a type-safe bridge between the AI Sidebar and SaaS services.
 */

// --- LMS / Course Builder Tools ---

export type LessonType = 'video' | 'document' | 'text' | 'quiz';

export interface LMSCourseTool {
    /** Creates or updates a recovery course */
    upsertCourse: (tenantId: string, courseData: {
        title: string;
        description: string;
        category: 'sobriety' | 'fitness' | 'wellness' | 'mental-health';
        status: 'draft' | 'published';
    }) => Promise<string>;

    /** Adds a structured module to an existing course */
    addModule: (courseId: string, moduleData: {
        title: string;
        order: number;
        lessons: LessonDefinition[];
    }) => Promise<void>;
}

export interface LessonDefinition {
    title: string;
    type: LessonType;
    content: string; // YouTube URL, Storage Path, or Markdown
    completionCriteria?: {
        minQuizScore?: number;
        requireManualCheckoff?: boolean;
    };
}

// --- Incident & Reporting Tools ---

export interface IncidentReportTool {
    /** Generates a professional incident report draft from raw chat input or house data */
    draftIncidentReport: (tenantId: string, data: {
        residentId: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        date: Date;
        location: string;
    }) => Promise<string>;

    /** Notifies specific staff members based on incident severity */
    escalateIncident: (incidentId: string, staffIds: string[]) => Promise<void>;
}

// --- Agent Command Registry ---

export interface HVGAgentCommand {
    command: '/courses' | '/incidents' | '/events' | '/rides' | '/promote';
    description: string;
    parameters: Record<string, any>;
    execute: (context: AgentExecutionContext) => Promise<AgentResponse>;
}

export interface AgentExecutionContext {
    tenantId: string;
    userId: string;
    userRole: 'admin' | 'staff' | 'tenant_admin';
    currentRoute: string; // e.g., "/[tenantId]/incidents"
}

export interface AgentResponse {
    message: string;
    componentToRender?: string; // e.g., "MiniCourseCard"
    data?: any;
}