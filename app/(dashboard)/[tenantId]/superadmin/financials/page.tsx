'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { CircleDollarSign, TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

function StatCard({ title, value, change, trend, icon }: {
    title: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down';
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">{icon}</div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                    trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-black tracking-tight mt-1">{value}</h3>
            </div>
        </div>
    );
}

export default function SuperAdminFinancialsPage() {
    const { user } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function fetchFinancials() {
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/admin/financials', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch financials');
            setData(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchFinancials();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aggregating Financial Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-white italic">Platform Financials</h2>
                    <p className="text-slate-400 text-sm mt-1">Revenue tracking and subscription health across all partners.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    STRIPE LIVE MODE
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Monthly Recurring Revenue"
                    value={`$${(data?.stats?.totalRevenue || 0).toLocaleString()}`}
                    change="+12.5%"
                    trend="up"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                />
                <StatCard
                    title="Active Subscriptions"
                    value={data?.stats?.activeSubscriptions || 0}
                    change="+3"
                    trend="up"
                    icon={<Users className="w-5 h-5 text-fuchsia-400" />}
                />
                <StatCard
                    title="Avg. Revenue Per Tenant"
                    value={`$${Math.round((data?.stats?.totalRevenue || 0) / (data?.summary?.length || 1))}`}
                    change="-2.4%"
                    trend="down"
                    icon={<CircleDollarSign className="w-5 h-5 text-cyan-400" />}
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Subscription Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Partner Organization</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">MRR</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Next Billing</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {data?.summary?.map((s: any) => (
                                <tr key={s.id} className="hover:bg-white/10 transition-colors group text-sm">
                                    <td className="px-6 py-4 font-bold text-white group-hover:text-fuchsia-300 transition-colors">{s.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/10">{s.plan}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold">${s.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                                            s.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                                        {s.nextBilling ? new Date(s.nextBilling).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white">
                                            <CreditCard className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
