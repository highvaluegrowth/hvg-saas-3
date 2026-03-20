'use client';

import { useChatStore, ChatFilterType } from '@/lib/stores/useChatStore';
import type { Conversation } from '../schemas/chat.schemas';

const FILTER_TABS: { id: ChatFilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dms', label: 'DMs' },
  { id: 'ai', label: 'AI' },
  { id: 'alerts', label: 'Alerts' },
];

const TYPE_ICON: Record<string, string> = {
  dm: '💬',
  group: '👥',
  course: '📚',
  event: '📅',
  application_thread: '📋',
  system_alert: '🔔',
  ai_chat: '🤖',
};

interface ThreadListProps {
  conversations: Conversation[];
  loading?: boolean;
}

export function ThreadList({ conversations, loading = false }: ThreadListProps) {
  const { filterType, setFilterType, setActiveConversation } = useChatStore();

  const filtered = conversations.filter((c) => {
    if (filterType === 'all') return true;
    if (filterType === 'ai') return c.type === 'ai_chat';
    if (filterType === 'alerts') return c.type === 'system_alert';
    if (filterType === 'dms') return c.type === 'dm' || c.type === 'group';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/8">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-3">Messages</h2>
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterType === tab.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <span className="text-3xl">📭</span>
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
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-base shrink-0">
                    {TYPE_ICON[conv.type] ?? '💬'}
                  </div>
                  {/* Content */}
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
