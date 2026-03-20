'use client';

import { useChatStore } from '@/lib/stores/useChatStore';
import type { Application } from '@/features/applications/types';

const TYPE_LABEL: Record<string, string> = {
  bed: 'Bed App',
  staff: 'Staff App',
  tenant: 'Tenant App',
  course: 'Course App',
  event: 'Event App',
};

interface ApplicationCardProps {
  app: Application & { threadId?: string };
}

export function ApplicationCard({ app }: ApplicationCardProps) {
  const { openDrawer, setActiveConversation } = useChatStore();

  const handleOpenThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!app.threadId) return;
    setActiveConversation(app.threadId);
    openDrawer();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-1.5 py-0.5 uppercase tracking-widest">
          {TYPE_LABEL[app.type] ?? app.type}
        </span>
        {app.threadId && (
          <button
            onClick={handleOpenThread}
            title="Open direct message thread"
            className="p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>

      <p className="text-sm font-semibold text-white truncate">{app.applicantName || 'Unknown Applicant'}</p>
      <p className="text-xs text-slate-500 truncate">{app.applicantEmail}</p>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          {app.status.replace(/_/g, ' ')}
        </span>
        <span className="text-[9px] text-slate-600">
          {new Date(app.submittedAt || app.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
