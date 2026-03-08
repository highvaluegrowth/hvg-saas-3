'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/features/auth/services/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  totalResidents: number;
  recentApplications: number;
  totalConversations: number;
  avgMessagesPerConversation: number;
}

interface TenantHealthRow {
  id: string;
  name: string;
  status: string;
  residentCount: number;
  plan: string;
  lastActive: string | null;
}

interface ApplicationFunnel {
  pending: number;
  assigned: number;
  accepted: number;
  rejected: number;
  total: number;
}

interface AnalyticsData {
  platform: PlatformStats;
  tenantHealth: TenantHealthRow[];
  applicationFunnel: ApplicationFunnel;
  applicationsByType: { bed: number; staff: number; other: number };
  generatedAt: string;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = 'emerald',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'cyan' | 'rose';
  icon: string;
}) {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  icon: 'text-purple-500' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    icon: 'text-cyan-500' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: 'text-rose-500' },
  };
  const c = colors[color];

  return (
    <div className={`${c.bg} border border-gray-200 rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${c.text}`}>{value.toLocaleString()}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <span className={`text-2xl ${c.icon}`}>{icon}</span>
      </div>
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   'bg-emerald-100 text-emerald-700',
    approved: 'bg-emerald-100 text-emerald-700',
    pending:  'bg-amber-100   text-amber-700',
    trial:    'bg-blue-100    text-blue-700',
    inactive: 'bg-gray-100   text-gray-600',
    suspended:'bg-rose-100   text-rose-700',
    rejected: 'bg-rose-100   text-rose-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    free:         'bg-gray-100 text-gray-600',
    starter:      'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise:   'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[plan] ?? 'bg-gray-100 text-gray-600'}`}>
      {plan}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-4 text-gray-500 text-sm">Aggregating platform data…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-sm">
          {error ?? 'Failed to load analytics'}
        </div>
        <button onClick={load} className="mt-3 text-sm text-emerald-600 hover:underline">Retry</button>
      </div>
    );
  }

  const { platform, tenantHealth, applicationFunnel, applicationsByType, generatedAt } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Last updated: {new Date(generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={load}
          className="text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Platform KPIs ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Platform KPIs</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Tenants"
            value={platform.totalTenants}
            sub={`${platform.activeTenants} active · ${platform.pendingTenants} pending`}
            color="emerald"
            icon="🏠"
          />
          <KpiCard
            label="Total Residents"
            value={platform.totalResidents}
            sub="across active enrollments"
            color="blue"
            icon="👥"
          />
          <KpiCard
            label="Applications (30d)"
            value={platform.recentApplications}
            sub="bed + staff applications"
            color="amber"
            icon="📋"
          />
          <KpiCard
            label="AI Conversations"
            value={platform.totalConversations}
            sub={`avg ${platform.avgMessagesPerConversation} msgs each`}
            color="purple"
            icon="🤖"
          />
        </div>
      </section>

      {/* ── Application Funnel + By Type ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Application Funnel</h2>
          <p className="text-xs text-gray-400 mb-5">All-time ({applicationFunnel.total} total)</p>
          <div className="space-y-4">
            <FunnelBar label="Pending" value={applicationFunnel.pending} total={applicationFunnel.total} color="bg-amber-400" />
            <FunnelBar label="Assigned to Tenant" value={applicationFunnel.assigned} total={applicationFunnel.total} color="bg-blue-400" />
            <FunnelBar label="Accepted" value={applicationFunnel.accepted} total={applicationFunnel.total} color="bg-emerald-500" />
            <FunnelBar label="Rejected" value={applicationFunnel.rejected} total={applicationFunnel.total} color="bg-rose-400" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Applications by Type</h2>
          <p className="text-xs text-gray-400 mb-5">Breakdown of application categories</p>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{applicationsByType.bed}</p>
                <p className="text-sm text-gray-500 mt-0.5">🛏 Bed Applications</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{applicationsByType.staff}</p>
                <p className="text-sm text-gray-500 mt-0.5">💼 Staff Applications</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-400">{applicationsByType.other}</p>
                <p className="text-sm text-gray-500 mt-0.5">📎 Other</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Platform Usage</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{platform.totalConversations}</p>
                  <p className="text-xs text-gray-400">Total conversations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{platform.avgMessagesPerConversation}</p>
                  <p className="text-xs text-gray-400">Avg messages / conversation</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Tenant Health Table ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Tenant Health {tenantHealth.length < platform.totalTenants && <span className="text-gray-400 font-normal normal-case">(top {tenantHealth.length})</span>}
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Tenant', 'Status', 'Residents', 'Plan', 'Last Active'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenantHealth.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No tenants found</td>
                </tr>
              ) : (
                tenantHealth.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">{t.residentCount}</span>
                      <span className="text-xs text-gray-400 ml-1">residents</span>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={t.plan} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.lastActive
                        ? new Date(t.lastActive).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
