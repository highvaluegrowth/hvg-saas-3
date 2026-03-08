'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useChores } from '@/features/chores/hooks/useChores';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Chore, ChoreStatus, ChorePriority } from '@/features/chores/types/chore.types';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';

const STATUS_LABELS: Record<ChoreStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  overdue: 'Overdue',
};

const PRIORITY_LABELS: Record<ChorePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const KANBAN_COLUMNS: { status: ChoreStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Pending', color: 'border-yellow-400' },
  { status: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { status: 'done', label: 'Done', color: 'border-green-400' },
  { status: 'overdue', label: 'Overdue', color: 'border-red-400' },
];

function priorityBadgeClass(priority: ChorePriority): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function statusBadgeClass(status: ChoreStatus): string {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDate(date?: Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface KanbanCardProps {
  chore: Chore;
  tenantId: string;
  canDrag: boolean;
  onDragStart: (id: string) => void;
}

function KanbanCard({ chore, tenantId, canDrag, onDragStart }: KanbanCardProps) {
  return (
    <Link href={`/${tenantId}/chores/${chore.id}`}>
      <div
        draggable={canDrag}
        onDragStart={() => onDragStart(chore.id)}
        className={`rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm font-medium text-white mb-2 line-clamp-2">{chore.title}</p>
        <div className="flex items-center justify-between">
          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${priorityBadgeClass(chore.priority)}`}>
            {PRIORITY_LABELS[chore.priority]}
          </span>
          {chore.dueDate && (
            <span className="text-xs text-gray-500">{formatDate(chore.dueDate)}</span>
          )}
        </div>
        {chore.assigneeIds.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{chore.assigneeIds.length} assignee{chore.assigneeIds.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </Link>
  );
}

export default function ChoresPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const { user } = useAuth();
  const { chores, loading, error } = useChores(tenantId);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  async function handleStatusChange(choreId: string, newStatus: ChoreStatus) {
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update chore status', err);
    }
  }

  async function handleDelete(choreId: string) {
    if (!confirm('Delete this chore?')) return;
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to delete chore', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-800 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chores</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>House tasks and assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-cyan-600 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-cyan-600 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              Board
            </button>
          </div>
          {userCanWrite && (
            <Link href={`/${tenantId}/chores/new`}>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Add Chore</Button>
            </Link>
          )}
        </div>
      </div>

      {chores.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1 text-white">No chores yet</h3>
            <p className="mb-6 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Create your first chore.</p>
            {userCanWrite && (
              <Link href={`/${tenantId}/chores/new`}>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Create First Chore</Button>
              </Link>
            )}
          </div>
        </div>
      ) : view === 'list' ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Assignees</th>
                  {userCanWrite && <th className="px-6 py-4" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {chores.map((chore) => (
                  <tr key={chore.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/${tenantId}/chores/${chore.id}`} className="text-sm font-medium transition-colors hover:underline" style={{ color: '#67E8F9' }}>
                        {chore.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadgeClass(chore.priority)}`}>
                        {PRIORITY_LABELS[chore.priority]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(chore.status)}`}>
                        {STATUS_LABELS[chore.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDate(chore.dueDate)}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{chore.assigneeIds.length}</td>
                    {userCanWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/${tenantId}/chores/${chore.id}`}>
                            <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">Edit</Button>
                          </Link>
                          <Button variant="outline" size="sm" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleDelete(chore.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnChores = chores.filter((c) => c.status === column.status);
            return (
              <div
                key={column.status}
                className="rounded-lg p-4 min-h-48"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `4px solid var(--column-${column.status}-color, rgba(8,145,178,0.5))` }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId && userCanWrite) {
                    handleStatusChange(draggingId, column.status);
                    setDraggingId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">{column.label}</h3>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    {columnChores.length}
                  </span>
                </div>
                {columnChores.map((chore) => (
                  <KanbanCard
                    key={chore.id}
                    chore={chore}
                    tenantId={tenantId}
                    canDrag={userCanWrite}
                    onDragStart={setDraggingId}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
