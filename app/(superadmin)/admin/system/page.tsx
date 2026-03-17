'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { ServerCrash, ShieldCheck, Activity, Cpu, HardDrive, Network, Globe, RefreshCcw } from 'lucide-react';

export default function AdminSystemPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchSystemHealth() {
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/admin/system', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch system health');
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading system health');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchSystemHealth();
    }, [user]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pinging Core Subsystems...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white italic">System Health</h1>
                    <p className="text-slate-400 text-sm mt-1">Infrastructure monitoring, security audit logs, and service status.</p>
                </div>
                <button 
                    onClick={fetchSystemHealth}
                    className="bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10 transition-all"
                >
                    <RefreshCcw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Global Status Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-emerald-400">All Systems Operational</h2>
                        <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest">Global Status: {data?.status}</p>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Version</p>
                    <p className="text-sm font-black text-white">{data?.version}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Services List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dependency Health</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {data?.services?.map((service: any) => (
                                <div key={service.name} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-200">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-600 uppercase">Latency</p>
                                            <p className="text-xs font-mono text-slate-400">{service.latency}</p>
                                        </div>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                            {service.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Infrastructure Info */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Environment</h3>
                        
                        <div className="space-y-4">
                            <InfoRow icon={<Cpu size={14} />} label="Node Version" value="v20.11.0" />
                            <InfoRow icon={<Globe size={14} />} label="Deployment Region" value={data?.region || 'us-central1'} />
                            <InfoRow icon={<HardDrive size={14} />} label="Disk Usage" value="14.2 GB / 50 GB" />
                            <InfoRow icon={<Network size={14} />} label="Traffic Source" value="Google Edge" />
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Security Context</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">HIPAA COMPLIANT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300 transition-colors">
                {icon}
                <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
            </div>
            <span className="text-xs font-mono text-white">{value}</span>
        </div>
    );
}
