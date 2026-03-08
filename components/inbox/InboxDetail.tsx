import { InboxNotification } from '@/features/inbox/types/inbox.types';
import { Button } from '@/components/ui/Button';

interface InboxDetailProps {
    notification: InboxNotification;
    onArchive: (id: string) => void;
    onNavigateToSource: (n: InboxNotification) => void;
}

export function InboxDetail({ notification, onArchive, onNavigateToSource }: InboxDetailProps) {
    const getIcon = () => {
        switch (notification.type) {
            case 'application': return '📋';
            case 'request': return '👋';
            case 'incident': return '🚨';
            case 'system': return '⚙️';
            default: return '📬';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[rgba(255,255,255,0.01)] relative">
            {/* Header actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onArchive(notification.id)}
                    className="text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                >
                    Archive
                </Button>
            </div>

            <div className="p-8 max-w-3xl mx-auto w-full space-y-8 mt-12">
                {/* Title area */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                            {getIcon()}
                        </div>
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
                                {notification.type}
                                {notification.priority === 'high' && <span className="text-red-400 ml-2 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">High Priority</span>}
                            </span>
                            <p className="text-xs text-white/30 mt-0.5">
                                {new Date(notification.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {notification.title}
                    </h1>
                    {notification.actorName && (
                        <p className="text-sm text-cyan-400 mt-2 font-medium">
                            Requested by {notification.actorName}
                        </p>
                    )}
                </div>

                {/* Content Preview */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/80 leading-relaxed shadow-inner">
                    <p>{notification.preview}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                    <Button
                        className="bg-linear-to-br from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border-0 shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_25px_rgba(8,145,178,0.4)] transition-all"
                        onClick={() => onNavigateToSource(notification)}
                    >
                        Review Details
                    </Button>
                </div>
            </div>
        </div>
    );
}
