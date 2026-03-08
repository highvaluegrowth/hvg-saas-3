import { InboxNotification, NotificationType } from '@/features/inbox/types/inbox.types';
import { Button } from '@/components/ui/Button';

interface InboxListProps {
    notifications: InboxNotification[];
    selectedId: string | null;
    onSelect: (notif: InboxNotification) => void;
    filter: NotificationType | 'all';
    onFilterChange: (type: NotificationType | 'all') => void;
    showUnreadOnly: boolean;
    onUnreadOnlyChange: (val: boolean) => void;
    onMarkAllRead: () => void;
}

const TYPE_FILTERS: { label: string; value: NotificationType | 'all'; icon: string }[] = [
    { label: 'All', value: 'all', icon: '📬' },
    { label: 'Applications', value: 'application', icon: '📋' },
    { label: 'Requests', value: 'request', icon: '👋' },
    { label: 'Incidents', value: 'incident', icon: '🚨' },
    { label: 'System', value: 'system', icon: '⚙️' },
];

export function InboxList({
    notifications,
    selectedId,
    onSelect,
    filter,
    onFilterChange,
    showUnreadOnly,
    onUnreadOnlyChange,
    onMarkAllRead,
}: InboxListProps) {
    const filtered = notifications.filter((n) => {
        if (filter !== 'all' && n.type !== filter) return false;
        if (showUnreadOnly && n.isRead) return false;
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-[rgba(255,255,255,0.02)] border-r border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white tracking-tight">Unified Inbox</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllRead}
                        className="text-xs text-white/50 hover:text-white"
                    >
                        Mark all read
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    {TYPE_FILTERS.map((f) => {
                        const isActive = filter === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => onFilterChange(f.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                                    }`}
                            >
                                <span className="text-xs">{f.icon}</span>
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Unread Toggle */}
                <div className="flex items-center justify-between pl-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => onUnreadOnlyChange(e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="w-8 h-4 bg-white/10 rounded-full peer-checked:bg-cyan-500/50 transition-colors relative">
                            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                        </div>
                        <span className="text-xs font-semibold text-white/50 peer-checked:text-cyan-400 transition-colors">
                            Unread only
                        </span>
                    </label>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-white/40 text-sm">
                        No notifications found
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map((n) => {
                            const isSelected = selectedId === n.id;
                            // High priority = red dot, normal = cyan dot
                            const dotColor = n.priority === 'high' ? 'bg-red-500' : 'bg-cyan-400';

                            return (
                                <button
                                    key={n.id}
                                    onClick={() => onSelect(n)}
                                    className={`w-full text-left p-4 transition-colors relative ${isSelected ? 'bg-white/5' : 'hover:bg-white/2'
                                        } ${!n.isRead ? 'font-semibold' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {!n.isRead && (
                                                <div className={`w-2 h-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(34,211,238,0.5)]`} />
                                            )}
                                            <span className="text-sm text-white/90 truncate max-w-[200px]">
                                                {n.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-white/40 shrink-0">
                                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <p
                                        className={`text-xs pl-${!n.isRead ? '4' : '0'} ${!n.isRead ? 'text-white/70' : 'text-white/50'
                                            } line-clamp-2`}
                                    >
                                        {n.preview}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
