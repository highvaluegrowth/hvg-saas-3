'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

interface AnalyticsData {
    platform: {
        totalTenants: number;
        activeTenants: number;
        pendingTenants: number;
        totalResidents: number;
        recentApplications: number;
        totalConversations: number;
        avgMessagesPerConversation: number;
    };
    tenantHealth: Array<{
        id: string;
        name: string;
        status: string;
        residentCount: number;
        plan: string;
        lastActive: string | null;
    }>;
    applicationFunnel: {
        pending: number;
        assigned: number;
        accepted: number;
        rejected: number;
        total: number;
    };
}

interface CommandCenterPageProps {
    params: Promise<{ tenantId: string }>;
}

export default function CommandCenterPage({ params }: CommandCenterPageProps) {
    const { tenantId } = use(params);
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch('/api/admin/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch analytics');
                setData(await res.json());
            } catch {
                // silent — show zeros
            } finally {
                setLoading(false);
            }
        }
        if (user) fetchAnalytics();
    }, [user]);

    if (loading) return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-8 w-64 bg-white/5 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Platform Command Center</h1>
                <p className="text-slate-400 text-sm mt-1">Real-time oversight of the High Value Growth ecosystem.</p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Active Tenants" value={data?.platform.activeTenants ?? 0} sub={`${data?.platform.totalTenants} total orgs`} color="cyan" />
                <KPICard title="Total Residents" value={data?.platform.totalResidents ?? 0} sub="Enrolled platform-wide" color="emerald" />
                <KPICard title="Pending Apps" value={data?.applicationFunnel.pending ?? 0} sub="Awaiting triage" color="blue" />
                <KPICard title="Monthly Revenue" value="--" sub="Stripe sync pending" color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Funnel */}
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Growth Activity (30d)</h3>
                    <div className="space-y-6">
                        <FunnelStep label="New Applications" value={data?.applicationFunnel.total ?? 0} color="cyan" />
                        <FunnelStep label="Assigned to Orgs" value={data?.applicationFunnel.assigned ?? 0} color="blue" />
                        <FunnelStep label="Final Admissions" value={data?.applicationFunnel.accepted ?? 0} color="emerald" />
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/5">
                        <Link href={`/${tenantId}/superadmin/applications`} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
                            OPEN TRIAGE INBOX <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* Tenant Health */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Performing Organizations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Organization</th>
                                    <th className="px-6 py-3">Residents</th>
                                    <th className="px-6 py-3">Plan</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data?.tenantHealth.map(t => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-sm">{t.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-300">{t.residentCount}</td>
                                        <td className="px-6 py-4 text-xs capitalize text-slate-400">{t.plan}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, sub, color }: { title: string; value: string | number; sub: string; color: 'cyan' | 'emerald' | 'blue' | 'amber' }) {
    const glowClass = { cyan: 'text-cyan-400', emerald: 'text-emerald-400', blue: 'text-blue-400', amber: 'text-amber-400' }[color];
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 bg-current ${glowClass}`} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{title}</p>
            <span className="text-4xl font-black text-white">{value}</span>
            <p className="text-xs text-slate-500 mt-2">{sub}</p>
        </div>
    );
}

function FunnelStep({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-slate-400">{label}</span>
                <span className="text-sm font-bold">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-${color}-500`} style={{ width: '100%' }} />
            </div>
        </div>
    );
}
