import { adminDb as db } from './admin';
import type { NotificationType, NotificationPriority } from '@/features/inbox/types/inbox.types';

export interface CreateNotificationInput {
    tenantId: string;
    userId: string;
    type: NotificationType;
    refId: string;
    refCollection: string;
    title: string;
    preview: string;
    priority?: NotificationPriority;
    actorName?: string;
    actorId?: string;
    metadata?: Record<string, unknown>;
}

export const notificationService = {
    /**
     * Create a notification for a user
     */
    async createNotification(input: CreateNotificationInput) {
        const now = Date.now();
        const notificationData = {
            ...input,
            isRead: false,
            createdAt: now,
            priority: input.priority || 'normal',
        };

        const docRef = await db.collection('notifications').add(notificationData);
        return { id: docRef.id, ...notificationData };
    }
};
