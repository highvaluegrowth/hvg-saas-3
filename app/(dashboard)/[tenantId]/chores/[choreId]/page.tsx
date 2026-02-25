'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Chore, ChoreStatus, ChorePriority } from '@/features/chores/types/chore.types';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const STATUS_TRANSITIONS: Record<ChoreStatus, ChoreStatus[]> = {
  pending: ['in_progress', 'overdue'],
  in_progress: ['done', 'overdue', 'pending'],
  done: ['pending'],
  overdue: ['in_progress', 'done'],
};

const STATUS_LABELS: Record<ChoreStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
  overdue: 'Overdue',
};

function statusBadgeClass(status: ChoreStatus): string {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function priorityBadgeClass(priority: ChorePriority): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ChoreDetailPage({ params }: { params: Promise<{ tenantId: string; choreId: string }> }) {
  const { tenantId, choreId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [chore, setChore] = useState<Chore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [savingAssignees, setSavingAssignees] = useState(false);

  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  useEffect(() => {
    async function fetchChore() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Chore not found');
        const data = await res.json();
        setChore(data.chore);
        setAssigneeIds(data.chore.assigneeIds ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chore');
      } finally {
        setLoading(false);
      }
    }
    fetchChore();
  }, [tenantId, choreId]);

  async function updateStatus(newStatus: ChoreStatus) {
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setChore((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  async function saveAssignees(newIds: string[]) {
    setAssigneeIds(newIds);
    setSavingAssignees(true);
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigneeIds: newIds }),
      });
      setChore((prev) => prev ? { ...prev, assigneeIds: newIds } : prev);
    } catch (err) {
      console.error('Failed to update assignees', err);
    } finally {
      setSavingAssignees(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this chore?')) return;
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/chores/${choreId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push(`/${tenantId}/chores`);
    } catch (err) {
      console.error('Failed to delete chore', err);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error || !chore) return <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error || 'Chore not found'}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => router.push(`/${tenantId}/chores`)} className="text-sm text-gray-500 hover:text-gray-700">← Chores</button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{chore.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadgeClass(chore.priority)}`}>
              {chore.priority.charAt(0).toUpperCase() + chore.priority.slice(1)} Priority
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(chore.status)}`}>
              {STATUS_LABELS[chore.status]}
            </span>
            {chore.dueDate && (
              <span className="text-xs text-gray-500">
                Due: {new Date(chore.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        {userCanWrite && (
          <Button variant="ghost" className="text-red-600 hover:text-red-700 ml-4" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>

      {chore.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{chore.description}</p>
          </CardContent>
        </Card>
      )}

      {userCanWrite && (
        <Card>
          <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STATUS_TRANSITIONS[chore.status].map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus(nextStatus)}
                >
                  Mark as {STATUS_LABELS[nextStatus]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assignees {savingAssignees && <span className="text-xs text-gray-400 font-normal ml-2">Saving...</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          {userCanWrite ? (
            <ResidentSelector
              tenantId={tenantId}
              selectedIds={assigneeIds}
              onChange={saveAssignees}
              label=""
              placeholder="Search residents to assign..."
            />
          ) : (
            <p className="text-sm text-gray-600">{assigneeIds.length === 0 ? 'No assignees' : `${assigneeIds.length} resident(s) assigned`}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
