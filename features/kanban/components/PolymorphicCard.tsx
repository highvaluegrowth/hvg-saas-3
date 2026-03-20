'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApplicationCard } from './ApplicationCard';
import { ChoreCard } from './ChoreCard';
import type { BoardItem } from '../types';
import type { Application } from '@/features/applications/types';
import type { Chore } from '@/features/chores/types/chore.types';

interface PolymorphicCardProps {
  item: BoardItem;
}

export function PolymorphicCard({ item }: PolymorphicCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'BoardItem', item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#161B22] border border-white/10 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all select-none"
    >
      {item.type === 'application' && (
        <ApplicationCard app={item.rawData as Application & { threadId?: string }} />
      )}
      {item.type === 'chore' && (
        <ChoreCard chore={item.rawData as Chore} />
      )}
      {item.type === 'task' && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
          <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
        </div>
      )}
    </div>
  );
}
