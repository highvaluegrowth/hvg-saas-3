'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useIncidents } from '@/features/incidents/hooks/useIncidents';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '@/features/incidents/types/incident.types';
import { canReadAll } from '@/lib/utils/permissions';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

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

function typeClass(_type: IncidentType): string {
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
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600 mt-1">Incident reports and tracking</p>
        </div>
        {userCanReport && (
          <Link href={`/${tenantId}/incidents/new`}>
            <Button className="bg-red-600 hover:bg-red-700 text-white">Report Incident</Button>
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all' ? incidents.length : incidents.filter((i) => i.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.value
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.value ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'all' ? 'No incidents reported.' : `No ${activeTab} incidents.`}
            </p>
            {userCanReport && activeTab === 'all' && (
              <Link href={`/${tenantId}/incidents/new`}>
                <Button variant="outline" className="mt-4">Report First Incident</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((incident: Incident) => (
            <Link key={incident.id} href={`/${tenantId}/incidents/${incident.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-cyan-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{incident.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(incident.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {incident.involvedResidentIds.length + incident.involvedStaffIds.length > 0 && (
                        <> · {incident.involvedResidentIds.length + incident.involvedStaffIds.length} involved</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeClass(incident.type)}`}>
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
