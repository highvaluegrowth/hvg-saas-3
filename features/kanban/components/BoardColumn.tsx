'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BoardColumn as BoardColumnType, BoardItem } from '../types';

// ─── Sortable placeholder card (Phase 7.3 will replace with polymorphic cards) ─

function PlaceholderCard({ item }: { item: BoardItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'BoardItem', item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const TYPE_ICON: Record<string, string> = {
    application: '📋',
    chore: '✅',
    task: '🗒️',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all select-none"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{TYPE_ICON[item.type] ?? '📄'}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.type}</span>
      </div>
      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
      <p className="text-[9px] text-slate-600 mt-2">
        {item.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface BoardColumnProps {
  column: BoardColumnType;
  items: BoardItem[];
}

export function BoardColumn({ column, items }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">{column.label}</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-2xl border-2 transition-colors p-3 space-y-3 min-h-[480px]"
        style={{
          background: isOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          borderColor: isOver ? 'rgba(103,232,249,0.3)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <PlaceholderCard key={item.id} item={item} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="h-20 flex items-center justify-center">
            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest italic">
              Drop here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
