export type NotificationType = 'application' | 'request' | 'incident' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface InboxNotification {
    id: string;
    tenantId: string;
    type: NotificationType;
    refId: string; // ID of the source document
    refCollection: string; // Name of the source collection (e.g. applications, joinRequests)
    title: string;
    preview: string; // up to 120 chars
    isRead: boolean;
    createdAt: number;
    priority: NotificationPriority;
    actorName?: string; // e.g. "John Doe"
    actorId?: string; // User ID
    metadata?: Record<string, unknown>;
}
