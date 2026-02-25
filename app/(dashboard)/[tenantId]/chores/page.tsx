'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChores } from '@/features/chores/hooks/useChores';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Chore, ChoreStatus, ChorePriority } from '@/features/chores/types/chore.types';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

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
        className={`bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm hover:shadow-md transition-shadow ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{chore.title}</p>
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
  const router = useRouter();

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
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
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
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          <p className="text-gray-600 mt-1">House tasks and assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-sm font-medium ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Board
            </button>
          </div>
          {userCanWrite && (
            <Link href={`/${tenantId}/chores/new`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Chore</Button>
            </Link>
          )}
        </div>
      </div>

      {chores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No chores yet.</p>
            {userCanWrite && (
              <Link href={`/${tenantId}/chores/new`}>
                <Button variant="outline" className="mt-4">Create First Chore</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Due Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Assignees</th>
                  {userCanWrite && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chores.map((chore) => (
                  <tr key={chore.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/${tenantId}/chores/${chore.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
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
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(chore.dueDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{chore.assigneeIds.length}</td>
                    {userCanWrite && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/${tenantId}/chores/${chore.id}`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(chore.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        /* Kanban view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnChores = chores.filter((c) => c.status === column.status);
            return (
              <div
                key={column.status}
                className={`bg-gray-50 rounded-lg border-t-4 ${column.color} p-4 min-h-48`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId && userCanWrite) {
                    handleStatusChange(draggingId, column.status);
                    setDraggingId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{column.label}</h3>
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5">
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
