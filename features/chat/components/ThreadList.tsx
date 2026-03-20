'use client';

import { useChatStore, ChatFilterType } from '@/lib/stores/useChatStore';
import type { Conversation } from '../schemas/chat.schemas';

const FILTER_TABS: { id: ChatFilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'outlet', label: 'Outlet' },
  { id: 'dms', label: 'DMs' },
  { id: 'applications', label: 'Apps' },
  { id: 'requests', label: 'Requests' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'system', label: 'System' },
];

const TYPE_ICON: Record<string, string> = {
  dm: '💬',
  group: '👥',
  course: '📚',
  event: '📅',
  application_thread: '📋',
  system_alert: '🔔',
  ai_chat: '✦',
};

function matchesFilter(c: Conversation, filterType: ChatFilterType): boolean {
  if (filterType === 'all') return true;
  if (filterType === 'outlet') return c.type === 'ai_chat';
  if (filterType === 'dms') return c.type === 'dm' || c.type === 'group';
  if (filterType === 'applications') return c.type === 'application_thread';
  if (filterType === 'requests') return c.type === 'event' || c.type === 'course';
  if (filterType === 'incidents') return (c as any).metadata?.incidentId != null;
  if (filterType === 'system') return c.type === 'system_alert';
  return true;
}

interface ThreadListProps {
  conversations: Conversation[];
  loading?: boolean;
}

export function ThreadList({ conversations, loading = false }: ThreadListProps) {
  const { filterType, setFilterType, setActiveConversation, setVoiceMode, closeDrawer } = useChatStore();

  const filtered = conversations.filter((c) => matchesFilter(c, filterType));

  const startNewTextChat = () => {
    setVoiceMode(false);
    setActiveConversation('__new_outlet__');
  };

  const startNewVoiceChat = () => {
    setVoiceMode(true);
    setActiveConversation('__new_outlet__');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Communications</h2>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white shrink-0"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Filter Tabs — horizontally scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterType === tab.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outlet AI entry panel */}
      {filterType === 'outlet' && (
        <div className="px-4 py-4 border-b border-white/8 space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HVG Outlet AI</p>
          <div className="flex gap-2">
            <button
              onClick={startNewTextChat}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              New Text Chat
            </button>
            <button
              onClick={startNewVoiceChat}
              title="Start voice session"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
              Voice
            </button>
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/8 rounded w-2/3" />
                  <div className="h-2.5 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-12">
            <span className="text-3xl opacity-30">
              {filterType === 'outlet' ? '✦' : filterType === 'applications' ? '📋' : filterType === 'incidents' ? '⚠️' : '📭'}
            </span>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              No {filterType === 'all' ? '' : filterType + ' '}conversations yet
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-base shrink-0">
                    {TYPE_ICON[conv.type] ?? '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-sm font-bold text-white truncate">
                        {conv.title ?? 'Conversation'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.lastMessage?.text ?? 'No messages yet'}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
