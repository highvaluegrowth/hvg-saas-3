'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useIncidents } from '@/features/incidents/hooks/useIncidents';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '@/features/incidents/types/incident.types';
import { canReadAll } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';

const STATUS_TABS: { value: IncidentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_LABELS: Record<IncidentType, string> = {
  medical: 'Medical',
  behavioral: 'Behavioral',
  property: 'Property',
  safety: 'Safety',
  other: 'Other',
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

function severityClass(severity: IncidentSeverity): string {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function statusClass(status: IncidentStatus): string {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'investigating': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function typeClass(): string {
  return 'bg-cyan-100 text-cyan-800';
}

export default function IncidentsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const { user } = useAuth();
  const { incidents, loading, error } = useIncidents(tenantId);
  const [activeTab, setActiveTab] = useState<IncidentStatus | 'all'>('all');

  const userCanReport = user?.role ? canReadAll(user.role as UserRole) : false;

  const filtered = activeTab === 'all' ? incidents : incidents.filter((i) => i.status === activeTab);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-800 rounded-lg">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Incident reports and tracking</p>
        </div>
        {userCanReport && (
          <Link href={`/${tenantId}/incidents/new`}>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0 transition-opacity hover:opacity-90">Report Incident</Button>
          </Link>
        )}
      </div>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <nav className="-mb-px flex space-x-8">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all' ? incidents.length : incidents.filter((i) => i.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.value
                  ? 'border-cyan-400'
                  : 'border-transparent hover:border-white/20'
                  }`}
                style={{
                  color: activeTab === tab.value ? '#67E8F9' : 'rgba(255,255,255,0.45)',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs" style={activeTab === tab.value ? { background: 'rgba(8,145,178,0.25)', color: '#67E8F9' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1 text-white">
              {activeTab === 'all' ? 'No incidents reported.' : `No ${activeTab} incidents.`}
            </h3>
            <p className="mb-6 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Track incidents, violations, and safety reports.</p>
            {userCanReport && activeTab === 'all' && (
              <Link href={`/${tenantId}/incidents/new`}>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Report First Incident</Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((incident: Incident) => (
            <Link key={incident.id} href={`/${tenantId}/incidents/${incident.id}`}>
              <div className="rounded-lg p-4 transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate text-white">{incident.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(incident.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {incident.involvedResidentIds.length + incident.involvedStaffIds.length > 0 && (
                        <> &middot; {incident.involvedResidentIds.length + incident.involvedStaffIds.length} involved</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeClass()}`}>
                      {TYPE_LABELS[incident.type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityClass(incident.severity)}`}>
                      {SEVERITY_LABELS[incident.severity]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(incident.status)}`}>
                      {STATUS_LABELS[incident.status]}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
