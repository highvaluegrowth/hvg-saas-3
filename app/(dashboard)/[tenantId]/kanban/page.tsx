'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: KanbanStatus; label: string; color: string; bg: string; headerBg: string }[] = [
  { status: 'todo',        label: 'To Do',       color: 'border-gray-300',  bg: 'bg-gray-50',    headerBg: 'bg-gray-100'   },
  { status: 'in_progress', label: 'In Progress',  color: 'border-blue-300',  bg: 'bg-blue-50',    headerBg: 'bg-blue-100'   },
  { status: 'blocked',     label: 'Blocked',      color: 'border-red-300',   bg: 'bg-red-50',     headerBg: 'bg-red-100'    },
  { status: 'done',        label: 'Done',         color: 'border-green-300', bg: 'bg-green-50',   headerBg: 'bg-green-100'  },
];

const STATUS_ORDER: KanbanStatus[] = ['todo', 'in_progress', 'blocked', 'done'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function choreStatusToKanban(choreStatus: string): KanbanStatus {
  switch (choreStatus) {
    case 'in_progress': return 'in_progress';
    case 'done':        return 'done';
    case 'overdue':     return 'blocked';
    default:            return 'todo';
  }
}

function priorityBadge(priority?: string): string {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low':    return 'bg-gray-100 text-gray-600';
    default:       return 'bg-gray-100 text-gray-500';
  }
}

function nextStatus(current: KanbanStatus): KanbanStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

// ─── KanbanCard Component ─────────────────────────────────────────────────────

interface CardProps {
  card: KanbanCard;
  onMove: (id: string, newStatus: KanbanStatus) => Promise<void>;
  moving: boolean;
}

function KanbanCardComponent({ card, onMove, moving }: CardProps) {
  const next = nextStatus(card.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{card.title}</p>
        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700">
          {card.type}
        </span>
      </div>
      {card.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{card.description}</p>
      )}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {card.priority ? (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${priorityBadge(card.priority)}`}>
            {card.priority}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={() => onMove(card.id, next)}
          disabled={moving}
          className="text-xs text-cyan-600 font-medium hover:text-cyan-800 disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          {moving ? (
            'Moving...'
          ) : (
            <>
              Move to {COLUMNS.find((c) => c.status === next)?.label}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface KanbanPageProps {
  params: Promise<{ tenantId: string }>;
}

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
      const res = await fetch(`/api/tenants/${tenantId}/chores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: KanbanCard[] = (data.chores ?? []).map(
          (c: { id: string; title: string; description?: string; priority?: string; status: string; assigneeIds?: string[]; createdBy?: string }) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            priority: c.priority as KanbanCard['priority'],
            type: 'chore' as const,
            status: choreStatusToKanban(c.status),
            assigneeIds: c.assigneeIds ?? [],
            createdBy: c.createdBy,
          })
        );
        setCards(mapped);
      }
    } catch {
      // silently fail — show empty columns
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleMove(cardId: string, newStatus: KanbanStatus) {
    setMovingId(cardId);
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
    );
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus === 'todo' ? 'pending' : newStatus }),
      });
    } catch {
      // Revert on failure
      fetchCards();
    } finally {
      setMovingId(null);
    }
  }

  const visibleCards = myTasksOnly
    ? cards.filter((c) => c.assigneeIds?.includes(user?.uid ?? '') || c.createdBy === user?.uid)
    : cards;

  const columnCounts = COLUMNS.reduce<Record<KanbanStatus, number>>(
    (acc, col) => {
      acc[col.status] = visibleCards.filter((c) => c.status === col.status).length;
      return acc;
    },
    { todo: 0, in_progress: 0, blocked: 0, done: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">Task and workflow management</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setMyTasksOnly((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${myTasksOnly ? 'bg-cyan-600' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${myTasksOnly ? 'translate-x-4' : ''}`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">My tasks only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="space-y-3">
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colCards = visibleCards.filter((c) => c.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-[400px]">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${col.headerBg} border ${col.color}`}>
                  <h3 className="text-sm font-semibold text-gray-800">{col.label}</h3>
                  <span className="text-xs font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded-full min-w-[1.5rem] text-center">
                    {columnCounts[col.status]}
                  </span>
                </div>

                {/* Cards */}
                <div className={`flex-1 rounded-xl p-2 space-y-2.5 ${col.bg} border ${col.color} border-dashed`}>
                  {colCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <svg
                        className="w-7 h-7 text-gray-300 mb-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs text-gray-400">No tasks</p>
                    </div>
                  ) : (
                    colCards.map((card) => (
                      <KanbanCardComponent
                        key={card.id}
                        card={card}
                        onMove={handleMove}
                        moving={movingId === card.id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when no cards at all */}
      {!loading && cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            No chores found. Add chores from the{' '}
            <a href={`/${tenantId}/chores`} className="text-cyan-600 hover:underline font-medium">
              Chores page
            </a>{' '}
            to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
