export type FeedbackType = 'Bug' | 'Suggestion' | 'UI Issue';

export interface BoundingBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface QaFeedback {
    id?: string;
    tenantId?: string;
    reporterId?: string;
    route: string;
    targetElement: {
        tag: string;
        id: string;
        classes: string;
        dataComponent: string | null;
    };
    boundingBox: BoundingBox;
    type: FeedbackType;
    description: string;
    status: 'open' | 'resolved' | 'closed';
    createdAt: string; // ISO date string or Firebase timestamp
    browserInfo?: string; // Optional metadata
    viewportSize?: { width: number; height: number };
    screenshotDataUrl?: string; // Base64 encoded image
}
