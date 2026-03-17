'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

interface Tenant {
    id: string;
    name: string;
    status: string;
    city: string;
    ownerId: string;
    createdAt: string;
}

export default function TenantManagementPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchTenants() {
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/admin/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch tenants');
            const data = await res.json();
            setTenants(data.tenants || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading tenants');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchTenants();
    }, [user]);

    const handleImpersonate = (tenantId: string) => {
        if (confirm('Switch context to this organization?')) {
            authService.impersonateTenant(tenantId);
        }
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#0F071A] text-white">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Organization Management</h1>
                    <p className="text-slate-400 text-sm mt-1">Direct oversight and administrative control of all tenants.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400">
                    {tenants.length} TOTAL ORGANIZATIONS
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Organization Name</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4"><div className="h-10 bg-white/5 rounded-xl w-full" /></td>
                                    </tr>
                                ))
                            ) : tenants.map(t => (
                                <tr key={t.id} className="hover:bg-white/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{t.name}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{t.city || 'No Location'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{t.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                                            t.status === 'active' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-white/5 text-slate-500 border-white/10'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleImpersonate(t.id)}
                                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20"
                                            >
                                                Impersonate
                                            </button>
                                            <Link 
                                                href={`/admin/tenants/${t.id}`}
                                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                                            >
                                                Manage
                                            </Link>
                                        </div>
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
