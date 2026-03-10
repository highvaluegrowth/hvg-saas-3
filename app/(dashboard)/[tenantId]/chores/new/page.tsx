'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function NewChorePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = await authService.getIdToken();
      const body: Record<string, unknown> = {
        title: title.trim(),
        priority,
        assigneeIds,
      };
      if (description.trim()) body.description = description.trim();
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();

      const res = await fetch(`/api/tenants/${tenantId}/chores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create chore');
      }
      router.push(`/${tenantId}/chores`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Chore</h1>
        <p className="text-white/50 mt-1">Create a new house task</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
        )}

        <Card className="bg-white/5 border border-white/10">
          <CardHeader><CardTitle className="text-white">Task Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Clean kitchen, Mow lawn"
                required
                className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional details..."
                className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 scheme-dark"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border border-white/10">
          <CardHeader><CardTitle className="text-white">Assignees</CardTitle></CardHeader>
          <CardContent>
            <ResidentSelector
              tenantId={tenantId}
              selectedIds={assigneeIds}
              onChange={setAssigneeIds}
              label="Assign to residents"
              placeholder="Search residents..."
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/${tenantId}/chores`)} className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {submitting ? 'Creating...' : 'Create Chore'}
          </Button>
        </div>
      </form>
    </div>
  );
}
