'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { useHouses } from '@/features/houses/hooks/useHouses';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { StaffSelector } from '@/components/ui/StaffSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function NewIncidentPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const router = useRouter();
  const { houses } = useHouses(tenantId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('other');
  const [severity, setSeverity] = useState<string>('medium');
  const [houseId, setHouseId] = useState('');
  const [reportedAt, setReportedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [involvedResidentIds, setInvolvedResidentIds] = useState<string[]>([]);
  const [involvedStaffIds, setInvolvedStaffIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = await authService.getIdToken();
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        type,
        severity,
        involvedResidentIds,
        involvedStaffIds,
        reportedAt: new Date(reportedAt).toISOString(),
      };
      if (houseId) body.houseId = houseId;

      const res = await fetch(`/api/tenants/${tenantId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to report incident');
      }
      router.push(`/${tenantId}/incidents`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Incident</h1>
        <p className="text-gray-600 mt-1">Document an incident that occurred</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Brief description of the incident" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required placeholder="Detailed description of what happened..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="medical">Medical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="property">Property</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House (optional)</label>
                <select value={houseId} onChange={(e) => setHouseId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Select house —</option>
                  {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
                <input type="datetime-local" value={reportedAt} onChange={(e) => setReportedAt(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Involved People</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <ResidentSelector tenantId={tenantId} selectedIds={involvedResidentIds} onChange={setInvolvedResidentIds} label="Involved Residents" placeholder="Search residents..." />
            <StaffSelector tenantId={tenantId} selectedIds={involvedStaffIds} onChange={setInvolvedStaffIds} label="Involved Staff" placeholder="Search staff..." />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/${tenantId}/incidents`)}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
            {submitting ? 'Reporting...' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </div>
  );
}
