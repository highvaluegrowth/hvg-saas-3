import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    writeBatch,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { InboxNotification } from './types/inbox.types';
import { useInboxStore } from '@/lib/stores/inboxStore';

const COLLECTION_NAME = 'notifications';

export const inboxService = {
    /**
     * Subscribe to all notifications for a tenant
     */
    subscribeToNotifications: (
        tenantId: string,
        onData: (data: InboxNotification[]) => void,
        onError: (error: Error) => void
    ) => {
        if (!tenantId) {
            onData([]);
            return () => { };
        }

        const q = query(
            collection(db, COLLECTION_NAME),
            where('tenantId', '==', tenantId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const notifications = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as InboxNotification[];

                // Update global unread count
                const unreadCount = notifications.filter((n) => !n.isRead).length;
                useInboxStore.getState().setUnreadCount(unreadCount);

                onData(notifications);
            },
            onError
        );
    },

    /**
     * Mark a single notification as read
     */
    markAsRead: async (id: string, currentIsRead: boolean) => {
        if (currentIsRead) return;
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { isRead: true });
    },

    /**
     * Mark all notifications as read for a tenant
     */
    markAllAsRead: async (tenantId: string) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('tenantId', '==', tenantId),
                where('isRead', '==', false)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => {
                batch.update(d.ref, { isRead: true });
            });

            await batch.commit();
            useInboxStore.getState().setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    },

    /**
     * Archive a notification (you might want to delete or mark archived)
     * For now, we'll just delete it.
     */
    archiveNotification: async (id: string) => {
        // In a real system, maybe { isArchived: true }. Here we can delete.
        const docRef = doc(db, COLLECTION_NAME, id);
        const batch = writeBatch(db);
        batch.delete(docRef);
        await batch.commit();
    },
};
