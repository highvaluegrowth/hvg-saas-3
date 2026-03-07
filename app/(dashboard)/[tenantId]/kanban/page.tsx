'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';

type KanbanStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  type: 'chore';
  status: KanbanStatus;
  assigneeIds?: string[];
  createdBy?: string;
}

const COLUMNS: { status: KanbanStatus; label: string; accentColor: string; accentBg: string }[] = [
  { status: 'todo', label: 'To Do', accentColor: 'rgba(255,255,255,0.3)', accentBg: 'rgba(255,255,255,0.06)' },
  { status: 'in_progress', label: 'In Progress', accentColor: 'rgba(8,145,178,0.8)', accentBg: 'rgba(8,145,178,0.08)' },
  { status: 'blocked', label: 'Blocked', accentColor: 'rgba(239,68,68,0.7)', accentBg: 'rgba(239,68,68,0.07)' },
  { status: 'done', label: 'Done', accentColor: 'rgba(52,211,153,0.8)', accentBg: 'rgba(52,211,153,0.07)' },
];

const STATUS_ORDER: KanbanStatus[] = ['todo', 'in_progress', 'blocked', 'done'];

function choreStatusToKanban(s: string): KanbanStatus {
  switch (s) {
    case 'in_progress': return 'in_progress';
    case 'done': return 'done';
    case 'overdue': return 'blocked';
    default: return 'todo';
  }
}

function priorityStyle(priority?: string): React.CSSProperties {
  switch (priority) {
    case 'high': return { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' };
    case 'medium': return { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' };
    case 'low': return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' };
    default: return { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' };
  }
}

function nextStatus(current: KanbanStatus): KanbanStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

interface CardProps { card: KanbanCard; onMove: (id: string, s: KanbanStatus) => Promise<void>; moving: boolean; }

function KanbanCardComponent({ card, onMove, moving }: CardProps) {
  const next = nextStatus(card.status);
  const nextLabel = COLUMNS.find(c => c.status === next)?.label;
  return (
    <div className="rounded-xl p-3.5 transition-all hover:border-white/15" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-snug line-clamp-2">{card.title}</p>
        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(8,145,178,0.2)', color: '#67E8F9', border: '1px solid rgba(8,145,178,0.3)' }}>
          {card.type}
        </span>
      </div>
      {card.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{card.description}</p>
      )}
      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {card.priority ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={priorityStyle(card.priority)}>
            {card.priority}
          </span>
        ) : <span />}
        <button
          onClick={() => onMove(card.id, next)}
          disabled={moving}
          className="text-xs font-medium hover:text-cyan-300 disabled:opacity-40 transition-colors flex items-center gap-1"
          style={{ color: '#67E8F9' }}
        >
          {moving ? 'Moving...' : (<>Move to {nextLabel}<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></>)}
        </button>
      </div>
    </div>
  );
}

interface KanbanPageProps { params: Promise<{ tenantId: string }>; }

export default function KanbanPage({ params }: KanbanPageProps) {
  const { tenantId } = use(params);
  const { user } = useAuth();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/chores`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const mapped: KanbanCard[] = (data.chores ?? []).map((c: { id: string; title: string; description?: string; priority?: string; status: string; assigneeIds?: string[]; createdBy?: string }) => ({
          id: c.id, title: c.title, description: c.description, priority: c.priority as KanbanCard['priority'],
          type: 'chore' as const, status: choreStatusToKanban(c.status), assigneeIds: c.assigneeIds ?? [], createdBy: c.createdBy,
        }));
        setCards(mapped);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  async function handleMove(cardId: string, newStatus: KanbanStatus) {
    setMovingId(cardId);
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c)));
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus === 'todo' ? 'pending' : newStatus }),
      });
    } catch { fetchCards(); }
    finally { setMovingId(null); }
  }

  const visibleCards = myTasksOnly
    ? cards.filter(c => c.assigneeIds?.includes(user?.uid ?? '') || c.createdBy === user?.uid)
    : cards;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Task and workflow management</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setMyTasksOnly(v => !v)} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: myTasksOnly ? '#0891B2' : 'rgba(255,255,255,0.15)' }}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${myTasksOnly ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>My tasks only</span>
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.status} className="space-y-3">
              <div className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
              {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colCards = visibleCards.filter(c => c.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3" style={{ background: col.accentBg, border: `1px solid ${col.accentColor}22` }}>
                  <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    {colCards.length}
                  </span>
                </div>
                <div className="flex-1 rounded-xl p-2 space-y-2.5" style={{ background: col.accentBg, border: `1px dashed ${col.accentColor}33` }}>
                  {colCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <svg className="w-7 h-7 mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No tasks</p>
                    </div>
                  ) : colCards.map(card => (
                    <KanbanCardComponent key={card.id} card={card} onMove={handleMove} moving={movingId === card.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No chores found. Add chores from the{' '}
            <a href={`/${tenantId}/chores`} className="font-medium hover:text-cyan-300 transition-colors" style={{ color: '#67E8F9' }}>Chores page</a>
            {' '}to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
