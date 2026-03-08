'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inboxService } from '@/features/inbox/inboxService';
import { InboxNotification, NotificationType } from '@/features/inbox/types/inbox.types';
import { InboxList } from '@/components/inbox/InboxList';
import { InboxDetail } from '@/components/inbox/InboxDetail';

export default function InboxPage({
    params,
}: {
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = use(params);
    const router = useRouter();

    const [notifications, setNotifications] = useState<InboxNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<NotificationType | 'all'>('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    useEffect(() => {
        let unsubscribe = () => { };

        try {
            unsubscribe = inboxService.subscribeToNotifications(
                tenantId,
                (data) => {
                    setNotifications(data);
                    setLoading(false);
                },
                (err) => {
                    console.error('Inbox sync error', err);
                    setLoading(false);
                }
            );
        } catch {
            // Avoid calling setState synchronously here to prevent cascading renders warning
            // Usually, setup errors in effects don't throw anyway, but we log the stack trace just in case.
            console.error('An unexpected error occurred while setting up the inbox sync.');
        }

        return () => unsubscribe();
    }, [tenantId]);

    const selectedNotification = notifications.find((n) => n.id === selectedId) || null;

    const handleSelect = async (n: InboxNotification) => {
        setSelectedId(n.id);
        if (!n.isRead) {
            await inboxService.markAsRead(n.id, false);
        }
    };

    const handleArchive = async (id: string) => {
        await inboxService.archiveNotification(id);
        if (selectedId === id) setSelectedId(null);
    };

    const handleNavigateToSource = (n: InboxNotification) => {
        if (n.type === 'application') router.push(`/${tenantId}/applications/${n.refId}`);
        else if (n.type === 'request') router.push(`/${tenantId}/join-requests`);
        else if (n.type === 'incident') router.push(`/${tenantId}/incidents/${n.refId}`);
        else router.push(`/${tenantId}`); // Fallback for system etc
    };

    const handleMarkAllRead = async () => {
        await inboxService.markAllAsRead(tenantId);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="h-8 w-1/4 rounded bg-white/5 animate-pulse mb-6" />
                <div className="flex h-[75vh] gap-4">
                    <div className="w-1/3 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="flex-1 rounded-2xl bg-white/5 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-(--spacing(16)))] sm:h-[calc(100vh-(--spacing(24)))] p-4 sm:p-6 overflow-hidden">
            <div
                className="h-full flex rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Left List */}
                <div className="w-full sm:w-[350px] lg:w-[400px] shrink-0 h-full">
                    <InboxList
                        notifications={notifications}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        filter={filter}
                        onFilterChange={setFilter}
                        showUnreadOnly={showUnreadOnly}
                        onUnreadOnlyChange={setShowUnreadOnly}
                        onMarkAllRead={handleMarkAllRead}
                    />
                </div>

                {/* Right Detail */}
                <div className="hidden sm:block flex-1 h-full bg-black/20">
                    {selectedNotification ? (
                        <InboxDetail
                            notification={selectedNotification}
                            onArchive={handleArchive}
                            onNavigateToSource={handleNavigateToSource}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/30 text-sm flex-col">
                            <span className="text-4xl mb-4">📭</span>
                            Select a notification to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
