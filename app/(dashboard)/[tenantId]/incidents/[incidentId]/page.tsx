'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '@/features/incidents/types/incident.types';
import { canWrite } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { ResidentSelector } from '@/components/ui/ResidentSelector';
import { StaffSelector } from '@/components/ui/StaffSelector';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ['investigating', 'resolved'],
  investigating: ['resolved', 'open'],
  resolved: ['closed', 'investigating'],
  closed: [],
};

const STATUS_LABELS: Record<IncidentStatus, string> = { open: 'Open', investigating: 'Investigating', resolved: 'Resolved', closed: 'Closed' };
const TYPE_LABELS: Record<IncidentType, string> = { medical: 'Medical', behavioral: 'Behavioral', property: 'Property', safety: 'Safety', other: 'Other' };
const SEVERITY_LABELS: Record<IncidentSeverity, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

function severityClass(s: IncidentSeverity) {
  switch (s) { case 'critical': return 'bg-red-600 text-white'; case 'high': return 'bg-red-100 text-red-800'; case 'medium': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-gray-100 text-gray-700'; }
}
function statusClass(s: IncidentStatus) {
  switch (s) { case 'open': return 'bg-red-100 text-red-800'; case 'investigating': return 'bg-yellow-100 text-yellow-800'; case 'resolved': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-700'; }
}

export default function IncidentDetailPage({ params }: { params: Promise<{ tenantId: string; incidentId: string }> }) {
  const { tenantId, incidentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [involvedResidentIds, setInvolvedResidentIds] = useState<string[]>([]);
  const [involvedStaffIds, setInvolvedStaffIds] = useState<string[]>([]);
  const [resolvingStatus, setResolvingStatus] = useState<IncidentStatus | null>(null);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  const userCanWrite = user?.role ? canWrite(user.role as UserRole) : false;

  useEffect(() => {
    async function fetchIncident() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/incidents/${incidentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Incident not found');
        const data = await res.json();
        setIncident(data.incident);
        setInvolvedResidentIds(data.incident.involvedResidentIds ?? []);
        setInvolvedStaffIds(data.incident.involvedStaffIds ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load incident');
      } finally {
        setLoading(false);
      }
    }
    fetchIncident();
  }, [tenantId, incidentId]);

  async function updateStatus(newStatus: IncidentStatus, res?: string) {
    setSaving(true);
    try {
      const token = await authService.getIdToken();
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'resolved' && res) {
        body.resolution = res;
        body.resolvedAt = new Date().toISOString();
      }
      await fetch(`/api/tenants/${tenantId}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setIncident((prev) => prev ? { ...prev, status: newStatus, ...(body.resolution ? { resolution: res, resolvedAt: new Date() } : {}) } : prev);
      setResolvingStatus(null);
      setResolution('');
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setSaving(false);
    }
  }

  async function savePeople(newResidents: string[], newStaff: string[]) {
    setSaving(true);
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ involvedResidentIds: newResidents, involvedStaffIds: newStaff }),
      });
    } catch (err) {
      console.error('Failed to update people', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error || !incident) return <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error || 'Incident not found'}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <button onClick={() => router.push(`/${tenantId}/incidents`)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Incidents</button>
          <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{TYPE_LABELS[incident.type]}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityClass(incident.severity)}`}>{SEVERITY_LABELS[incident.severity]}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(incident.status)}`}>{STATUS_LABELS[incident.status]}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
            <p>Reported: {new Date(incident.reportedAt).toLocaleString()}</p>
            {incident.resolvedAt && <p>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</p>}
            {incident.resolution && <p className="text-gray-700 font-medium">Resolution: {incident.resolution}</p>}
          </div>
        </CardContent>
      </Card>

      {userCanWrite && incident.status !== 'closed' && STATUS_TRANSITIONS[incident.status].length > 0 && (
        <Card>
          <CardHeader><CardTitle>Update Status {saving && <span className="text-xs text-gray-400 font-normal ml-2">Saving...</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {resolvingStatus === 'resolved' ? (
              <div className="space-y-3">
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Describe how this was resolved..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <Button onClick={() => updateStatus('resolved', resolution)} className="bg-green-600 hover:bg-green-700 text-white">Confirm Resolved</Button>
                  <Button variant="outline" onClick={() => setResolvingStatus(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[incident.status].map((next) => (
                  <Button key={next} variant="outline" onClick={() => next === 'resolved' ? setResolvingStatus('resolved') : updateStatus(next)}>
                    Mark as {STATUS_LABELS[next]}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Involved People {saving && <span className="text-xs text-gray-400 font-normal ml-2">Saving...</span>}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {userCanWrite ? (
            <>
              <ResidentSelector tenantId={tenantId} selectedIds={involvedResidentIds} onChange={(ids) => { setInvolvedResidentIds(ids); savePeople(ids, involvedStaffIds); }} label="Involved Residents" placeholder="Search residents..." />
              <StaffSelector tenantId={tenantId} selectedIds={involvedStaffIds} onChange={(ids) => { setInvolvedStaffIds(ids); savePeople(involvedResidentIds, ids); }} label="Involved Staff" placeholder="Search staff..." />
            </>
          ) : (
            <div className="text-sm text-gray-600">
              <p>{involvedResidentIds.length} resident(s), {involvedStaffIds.length} staff member(s) involved</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
