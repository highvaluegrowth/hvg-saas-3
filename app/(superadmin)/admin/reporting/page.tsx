'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Activity, Users, Building2, ClipboardCheck, BarChart3, PieChart, LineChart, ArrowUpRight } from 'lucide-react';

export default function AdminReportingPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchReporting() {
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/admin/reporting', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch reporting data');
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading reporting data');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchReporting();
    }, [user]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synthesizing Platform Reports...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white italic">Platform Analytics</h1>
                    <p className="text-slate-400 text-sm mt-1">Holistic data aggregation across users, organizations, and clinical workflows.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    LIVE DATA
                </div>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ReportCard title="Total App Users" value={data?.stats?.totalUsers || 0} icon={<Users className="text-cyan-400" />} />
                <ReportCard title="Active Tenants" value={data?.stats?.totalTenants || 0} icon={<Building2 className="text-fuchsia-400" />} />
                <ReportCard title="Pending Apps" value={data?.appStatusBreakdown?.pending_triage || 0} icon={<ClipboardCheck className="text-amber-400" />} />
                <ReportCard title="Total Residents" value={data?.stats?.totalActiveResidents || 0} icon={<Activity className="text-emerald-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Application Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Application Pipeline</h2>
                        <PieChart className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="space-y-4">
                        {Object.entries(data?.appStatusBreakdown || {}).map(([status, count]: any) => (
                            <div key={status} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                    <span className="text-slate-400">{status.replace('_', ' ')}</span>
                                    <span className="text-white">{count}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-cyan-500 rounded-full" 
                                        style={{ width: `${(count / (data?.stats?.totalApplications || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Activity Placeholder */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">System Activity (7D)</h2>
                        <LineChart className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 flex items-center justify-center py-10">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Historical visualization under construction</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Avg. Uptime</p>
                            <p className="text-lg font-black text-emerald-400 mt-1">99.98%</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">API Latency</p>
                            <p className="text-lg font-black text-cyan-400 mt-1">124ms</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportCard({ title, value, icon }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex justify-between items-center mb-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black tracking-tight mt-1">{value}</h3>
        </div>
    );
}
