'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { useOperationsBoard } from '../hooks/useOperationsBoard';
import { BoardColumn } from './BoardColumn';
import { BOARD_COLUMNS, type BoardColumnId, type BoardItem } from '../types';

interface OperationsBoardProps {
  tenantId: string;
}

export function OperationsBoard({ tenantId }: OperationsBoardProps) {
  const { items: fetchedItems, isLoading, error, refresh } = useOperationsBoard(tenantId);

  // Local state for optimistic drag-and-drop — synced from hook on remote changes
  const [items, setItems] = useState<BoardItem[]>([]);
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);

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

    // Determine the destination column:
    // `over` may be a column droppable or another item inside a column
    const destColumnId =
      (BOARD_COLUMNS.find(c => c.id === overId)?.id as BoardColumnId | undefined) ??
      (items.find(i => i.id === overId)?.columnId);

    if (!destColumnId) return;

    const draggedItem = items.find(i => i.id === active.id);
    if (!draggedItem || draggedItem.columnId === destColumnId) return;

    // Optimistic update: move item to new column and re-sort by timestamp desc
    setItems(prev =>
      prev
        .map(item =>
          item.id === draggedItem.id
            ? { ...item, columnId: destColumnId }
            : item
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );

    // Phase 7.3 will add the Firestore mutation here
  };

  // Pre-group for column renders
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
  );
}
