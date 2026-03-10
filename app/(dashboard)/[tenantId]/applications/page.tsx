'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import type { Application, ApplicationStatus, ApplicationType } from '@/features/applications/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; badge: React.CSSProperties }> = {
  draft: {
    label: 'Draft',
    badge: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }
  },
  pending: {
    label: 'Submitted',
    badge: { background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }
  },
  pending_triage: {
    label: 'Under Global Review',
    badge: { background: 'rgba(6,182,212,0.1)', color: '#67E8F9', border: '1px solid rgba(6,182,212,0.2)' }
  },
  assigned_to_tenant: {
    label: 'Assigned to Org',
    badge: { background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }
  },
  assigned: {
    label: 'Assigned',
    badge: { background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }
  },
  accepted: {
    label: 'Accepted',
    badge: { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
  },
  waitlisted: {
    label: 'Waitlisted',
    badge: { background: 'rgba(139,92,246,0.1)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.2)' }
  },
  rejected: {
    label: 'Rejected',
    badge: { background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }
  },
  archived: {
    label: 'Archived',
    badge: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
  }
};

const TYPE_CONFIG: Record<ApplicationType, { label: string; icon: string }> = {
  bed: { label: 'Bed', icon: '🛏' },
  staff: { label: 'Staff', icon: '👤' },
  course: { label: 'Course', icon: '📚' },
  event: { label: 'Event', icon: '📅' },
  tenant: { label: 'Tenant', icon: '🏠' },
};

type FilterStatus = ApplicationStatus | 'all';
type FilterType = ApplicationType | 'all';

export default function ApplicationsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  // Confirm dialog state
  const [confirming, setConfirming] = useState<{
    applicationId: string;
    applicantName: string;
    action: 'accepted' | 'rejected';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (typeFilter !== 'all') qs.set('type', typeFilter);
      const res = await fetch(
        `/api/tenants/${tenantId}/applications?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to load applications');
      }
      const json = await res.json();
      setApplications(json.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter, typeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async (action: 'accepted' | 'rejected') => {
    if (!confirming) return;
    setActionLoading(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/applications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId: confirming.applicationId, status: action }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Action failed');
      }
      setConfirming(null);
      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Counts for filter tabs
  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    assigned: applications.filter(a => a.status === 'assigned').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const STATUS_TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'assigned', label: `Assigned (${counts.assigned})` },
    { value: 'pending', label: `Pending (${counts.pending})` },
    { value: 'accepted', label: `Accepted (${counts.accepted})` },
    { value: 'rejected', label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Bed and staff applications assigned to your house
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 lg:gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={statusFilter === tab.value
                ? { background: 'linear-gradient(135deg,#0891B2,#059669)', color: 'white' }
                : { color: 'rgba(255,255,255,0.6)', background: 'transparent' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as FilterType)}
          className="ml-auto px-4 py-2 rounded-xl text-sm transition-all outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
        >
          <option value="all" className="bg-gray-800 text-white">All Types</option>
          <option value="bed" className="bg-gray-800 text-white">Bed</option>
          <option value="staff" className="bg-gray-800 text-white">Staff</option>
          <option value="course" className="bg-gray-800 text-white">Course</option>
          <option value="event" className="bg-gray-800 text-white">Event</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl p-6 text-center text-red-200" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-white font-medium">No applications found</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Applications assigned to your house will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <tr>
                  <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Applicant</th>
                  <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Type</th>
                  <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Zip</th>
                  <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                  <th className="text-left px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Submitted</th>
                  <th className="text-right px-5 py-4 font-semibold uppercase tracking-wider text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map(app => {
                  const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  const typeCfg = TYPE_CONFIG[app.type] ?? { label: app.type, icon: '📄' };
                  const submittedDate = app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';
                  const canAct = app.status === 'assigned' || app.status === 'pending';

                  return (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{app.applicantName}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{app.applicantEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: 'rgba(255,255,255,0.08)' }}>{typeCfg.icon}</span>
                          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{typeCfg.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{app.zipCode || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={statusCfg.badge}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{submittedDate}</td>
                      <td className="px-5 py-4 text-right">
                        {canAct ? (
                          <div className="flex items-center justify-end gap-2 text-sm font-semibold">
                            <button onClick={() => setConfirming({ applicationId: app.id, applicantName: app.applicantName, action: 'accepted' })}
                              className="px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ color: '#6EE7B7', background: 'rgba(52,211,153,0.15)' }}>
                              Accept
                            </button>
                            <button onClick={() => setConfirming({ applicationId: app.id, applicantName: app.applicantName, action: 'rejected' })}
                              className="px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.15)' }}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm dialog modal */}
      {confirming && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100 p-4 overflow-y-auto">
          <div className="rounded-3xl shadow-2xl p-6 w-full max-w-sm" style={{ background: 'rgba(12,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-white mb-2">
              {confirming.action === 'accepted' ? 'Accept Application' : 'Reject Application'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {confirming.action === 'accepted'
                ? `Are you sure you want to accept ${confirming.applicantName}'s application?`
                : `Are you sure you want to reject ${confirming.applicantName}'s application? This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirming.action)}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 ${confirming.action === 'accepted' ? '' : 'bg-red-600'}`}
                style={confirming.action === 'accepted' ? { background: 'linear-gradient(135deg,#0891B2,#059669)' } : {}}
              >
                {actionLoading ? 'Saving…' : confirming.action === 'accepted' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
