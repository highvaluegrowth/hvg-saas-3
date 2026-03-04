'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Application, ApplicationStatus, ApplicationType } from '@/features/applications/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600' },
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
};

const TYPE_CONFIG: Record<ApplicationType, { label: string; icon: string }> = {
  bed:    { label: 'Bed',    icon: '🛏' },
  staff:  { label: 'Staff',  icon: '👤' },
  course: { label: 'Course', icon: '📚' },
  event:  { label: 'Event',  icon: '📅' },
  tenant: { label: 'Tenant', icon: '🏠' },
};

type FilterStatus = ApplicationStatus | 'all';
type FilterType = ApplicationType | 'all';

export default function ApplicationsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const { user } = useAuth();

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
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
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
  }, [user, tenantId, statusFilter, typeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async (action: 'accepted' | 'rejected') => {
    if (!confirming || !user) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
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
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    assigned: applications.filter(a => a.status === 'assigned').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const STATUS_TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all',      label: `All (${counts.all})` },
    { value: 'assigned', label: `Assigned (${counts.assigned})` },
    { value: 'pending',  label: `Pending (${counts.pending})` },
    { value: 'accepted', label: `Accepted (${counts.accepted})` },
    { value: 'rejected', label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">
          Bed and staff applications assigned to your house
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as FilterType)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
        >
          <option value="all">All Types</option>
          <option value="bed">Bed</option>
          <option value="staff">Staff</option>
          <option value="course">Course</option>
          <option value="event">Event</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-900 font-medium">No applications found</p>
          <p className="text-gray-500 text-sm mt-1">
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Applications assigned to your house will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Zip</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map(app => {
                const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const typeCfg = TYPE_CONFIG[app.type] ?? { label: app.type, icon: '📄' };
                const submittedDate = app.submittedAt
                  ? new Date(app.submittedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : '—';
                const canAct = app.status === 'assigned' || app.status === 'pending';

                return (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{app.applicantName}</p>
                      <p className="text-gray-500 text-xs">{app.applicantEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{typeCfg.icon}</span>
                        <span className="text-gray-700">{typeCfg.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{app.zipCode || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{submittedDate}</td>
                    <td className="px-4 py-3 text-right">
                      {canAct ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setConfirming({
                                applicationId: app.id,
                                applicantName: app.applicantName,
                                action: 'accepted',
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              setConfirming({
                                applicationId: app.id,
                                applicantName: app.applicantName,
                                action: 'rejected',
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirming.action === 'accepted' ? 'Accept Application' : 'Reject Application'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {confirming.action === 'accepted'
                ? `Are you sure you want to accept ${confirming.applicantName}'s application?`
                : `Are you sure you want to reject ${confirming.applicantName}'s application? This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirming.action)}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  confirming.action === 'accepted'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
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
