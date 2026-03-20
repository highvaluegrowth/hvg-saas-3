'use client';

import type { Chore } from '@/features/chores/types/chore.types';

const PRIORITY_CLASSES: Record<string, string> = {
  high:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:    'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

interface ChoreCardProps {
  chore: Chore;
}

export function ChoreCard({ chore }: ChoreCardProps) {
  const priorityClass = PRIORITY_CLASSES[chore.priority] ?? PRIORITY_CLASSES.low;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold border rounded-md px-1.5 py-0.5 uppercase tracking-widest ${priorityClass}`}>
          {chore.priority}
        </span>
        {chore.assigneeIds.length > 0 && (
          <span className="text-[9px] text-slate-500 font-medium">
            {chore.assigneeIds.length} assignee{chore.assigneeIds.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-white truncate">{chore.title}</p>
      {chore.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{chore.description}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{chore.status}</span>
        {chore.dueDate && (
          <span className="text-[9px] text-slate-500">
            Due {new Date(chore.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
