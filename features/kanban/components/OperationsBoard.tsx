'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { authService } from '@/features/auth/services/authService';
import { useOperationsBoard } from '../hooks/useOperationsBoard';
import { BoardColumn } from './BoardColumn';
import { mapColumnIdToNativeStatus } from '../utils/mapping';
import { BOARD_COLUMNS, type BoardColumnId, type BoardItem } from '../types';

interface OperationsBoardProps {
  tenantId: string;
}

// ─── Firestore mutations (via existing API routes) ────────────────────────────

async function patchChoreStatus(tenantId: string, choreId: string, status: string) {
  const token = await authService.getIdToken();
  const res = await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Chore PATCH failed: ${res.status}`);
}

async function patchApplicationStatus(
  tenantId: string,
  applicationId: string,
  status: 'reviewing' | 'waitlisted' | 'accepted' | 'rejected',
  notes?: string
) {
  const token = await authService.getIdToken();
  const res = await fetch(`/api/tenants/${tenantId}/applications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ applicationId, status, ...(notes ? { notes } : {}) }),
  });
  if (!res.ok) throw new Error(`Application PATCH failed: ${res.status}`);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OperationsBoard({ tenantId }: OperationsBoardProps) {
  const { items: fetchedItems, isLoading, error, refresh } = useOperationsBoard(tenantId);

  const [items, setItems] = useState<BoardItem[]>([]);
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);
  // Resolution modal: shown when an application is dropped into "resolved"
  const [resolveModal, setResolveModal] = useState<{ item: BoardItem; prevItems: BoardItem[] } | null>(null);
  const [resolveLoading, setResolveLoading] = useState<'accept' | 'reject' | null>(null);

  // Store previous items snapshot for rollback on mutation failure
  const prevItemsRef = useRef<BoardItem[]>([]);

  useEffect(() => {
    setItems(fetchedItems);
  }, [fetchedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    const item = items.find(i => i.id === event.active.id);
    if (item) setActiveItem(item);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const overId = over.id as string;
    const destColumnId: BoardColumnId | undefined =
      (BOARD_COLUMNS.find(c => c.id === overId)?.id as BoardColumnId | undefined) ??
      items.find(i => i.id === overId)?.columnId;

    if (!destColumnId) return;

    const draggedItem = items.find(i => i.id === active.id);
    if (!draggedItem || draggedItem.columnId === destColumnId) return;

    // Capture snapshot before optimistic update for potential rollback
    const snapshot = items;
    prevItemsRef.current = snapshot;

    // Optimistic update
    const updated = items
      .map(item => item.id === draggedItem.id ? { ...item, columnId: destColumnId } : item)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setItems(updated);

    const newNativeStatus = mapColumnIdToNativeStatus(draggedItem.type, destColumnId);

    // Application dropped in resolved → show Resolution Modal instead of a direct PATCH
    if (draggedItem.type === 'application' && destColumnId === 'resolved') {
      setResolveModal({ item: draggedItem, prevItems: snapshot });
      return;
    }

    // No valid status transition (e.g. application dragged back to action_required) → revert
    if (!newNativeStatus) {
      setItems(snapshot);
      return;
    }

    // Fire the mutation, revert on failure
    (async () => {
      try {
        if (draggedItem.type === 'chore') {
          await patchChoreStatus(tenantId, draggedItem.id, newNativeStatus);
        } else if (draggedItem.type === 'application') {
          await patchApplicationStatus(
            tenantId,
            draggedItem.id,
            newNativeStatus as 'reviewing' | 'waitlisted'
          );
        }
      } catch (err) {
        console.error('[OperationsBoard] mutation failed, reverting:', err);
        setItems(snapshot);
      }
    })();
  };

  const handleResolveApplication = async (verdict: 'accepted' | 'rejected') => {
    if (!resolveModal) return;
    setResolveLoading(verdict === 'accepted' ? 'accept' : 'reject');
    try {
      await patchApplicationStatus(tenantId, resolveModal.item.id, verdict);
      setResolveModal(null);
    } catch (err) {
      console.error('[OperationsBoard] resolve mutation failed, reverting:', err);
      setItems(resolveModal.prevItems);
      setResolveModal(null);
    } finally {
      setResolveLoading(null);
    }
  };

  // Pre-group items for column renders
  const itemsByColumn: Record<BoardColumnId, BoardItem[]> = {
    action_required: [],
    in_progress: [],
    resolved: [],
  };
  for (const item of items) {
    itemsByColumn[item.columnId].push(item);
  }

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-6">
        {BOARD_COLUMNS.map(col => (
          <div key={col.id} className="w-80 shrink-0">
            <div className="flex items-center gap-2 px-4 py-3 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: col.color }} />
              <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div className="rounded-2xl border border-white/6 p-3 space-y-3 min-h-[480px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 space-y-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-2.5 w-full rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-center">
        <div>
          <p className="text-rose-400 text-sm font-bold mb-3">{error}</p>
          <button
            onClick={refresh}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[560px]">
          {BOARD_COLUMNS.map(col => (
            <BoardColumn
              key={col.id}
              column={col}
              items={itemsByColumn[col.id]}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } },
            }),
          }}
        >
          {activeItem && (
            <div className="w-80 bg-white/10 border border-cyan-500/50 rounded-xl px-4 py-3 shadow-2xl ring-2 ring-cyan-500/30">
              <p className="text-sm font-semibold text-white truncate">{activeItem.title}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{activeItem.subtitle}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Resolution Modal — shown when an application is dropped into "resolved" */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0D1117] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Resolve Application</h3>
              <p className="text-slate-400 text-sm mt-1">
                How would you like to resolve{' '}
                <span className="text-white font-bold">{resolveModal.item.title}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveApplication('accepted')}
                disabled={!!resolveLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {resolveLoading === 'accept' && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Admit
              </button>
              <button
                onClick={() => handleResolveApplication('rejected')}
                disabled={!!resolveLoading}
                className="flex-1 bg-rose-600/20 hover:bg-rose-600/40 disabled:opacity-50 disabled:cursor-not-allowed text-rose-400 border border-rose-500/20 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {resolveLoading === 'reject' && (
                  <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                )}
                Reject
              </button>
            </div>
            <button
              onClick={() => { setItems(resolveModal.prevItems); setResolveModal(null); }}
              disabled={!!resolveLoading}
              className="w-full text-xs font-bold text-slate-500 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
