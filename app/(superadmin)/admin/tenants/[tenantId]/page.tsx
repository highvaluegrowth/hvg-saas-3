'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';

interface TenantDetail {
    id: string;
    name: string;
    status: string;
    city: string;
    ownerId: string;
    createdAt: string;
    residentCount: number;
    applicationCount: number;
    aiApiKey?: string;
    subscription?: {
        plan: string;
        status: string;
    };
}

export default function TenantDetailAdminPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { user } = useAuth();
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit states
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');

    useEffect(() => {
        async function fetchTenant() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/admin/tenants/${tenantId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch tenant details');
                const data = await res.json();
                setTenant(data.tenant);
                setEditName(data.tenant.name);
                setEditStatus(data.tenant.status);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading');
            } finally {
                setLoading(false);
            }
        }
        if (user) fetchTenant();
    }, [user, tenantId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/admin/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: editName, status: editStatus }),
            });
            if (!res.ok) throw new Error('Failed to update tenant');
            setTenant(prev => prev ? { ...prev, name: editName, status: editStatus } : null);
            alert('Settings saved successfully.');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleResetAIKey = async () => {
        if (!confirm('Are you sure you want to clear this tenant\'s AI API key? They will need to re-enter it to use AI features.')) return;
        try {
            const token = await authService.getIdToken();
            await fetch(`/api/admin/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ aiApiKey: null }),
            });
            alert('AI Key cleared.');
        } catch (err) {
            alert('Failed to clear key.');
        }
    };

    if (loading) return <div className="p-8 animate-pulse space-y-4"><div className="h-8 w-64 bg-white/5 rounded" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;
    if (!tenant) return <div className="p-8 text-white">Tenant not found.</div>;

    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#0F071A] text-white">
            <div className="flex items-center gap-4">
                <Link href="/admin/tenants" className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </Link>
                <h1 className="text-3xl font-black tracking-tighter uppercase">{tenant.name}</h1>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                    tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'
                }`}>
                    {tenant.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Organization Controls</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Organization Name</label>
                                <input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Operational Status</label>
                                <select 
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                >
                                    <option value="active">Active</option>
                                    <option value="pending">Pending Approval</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="revoked">Revoked / Terminated</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                            <button 
                                onClick={() => authService.impersonateTenant(tenant.id)}
                                className="text-cyan-400 font-bold text-xs hover:text-cyan-300 flex items-center gap-2"
                            >
                                👤 IMPERSONATE THIS TENANT <span>→</span>
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-[#D946EF] hover:bg-fuchsia-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 transition-all"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Security & API Section */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Security & Resources</h3>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-white">AI Engine Access</p>
                                <p className="text-xs text-slate-500">{tenant.aiApiKey ? 'Active Key Detected' : 'No Key Configured'}</p>
                            </div>
                            <button 
                                onClick={handleResetAIKey}
                                className="text-red-400 text-[10px] font-bold uppercase hover:bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 transition-all"
                            >
                                Force Reset Key
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="block text-2xl font-black text-white">{tenant.residentCount}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Residents</span>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <span className="block text-2xl font-black text-white">{tenant.applicationCount}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Apps</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing & Subscription</h3>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400">Current Plan</span>
                                <span className="text-xs font-black text-amber-400 uppercase tracking-tighter">{tenant.subscription?.plan || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Stripe Status</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">CONNECTED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
