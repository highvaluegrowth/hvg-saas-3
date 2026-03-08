'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import Link from 'next/link';
import { Tenant } from '@/features/tenant/types/tenant.types';
import { Building2, Search, Plus, Activity, Users, Globe } from 'lucide-react';

export default function SuperAdminTenantsPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchTenants() {
            if (!user) return;

            try {
                const token = await authService.getIdToken();
                const res = await fetch('/api/admin/tenants?status=all', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setTenants(data.tenants || []);
                } else {
                    setError('Failed to fetch tenants.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchTenants();
    }, [user]);

    const filteredTenants = tenants.filter(tenant =>
        tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = tenants.filter(t => t.status === 'active').length;
    // Mocking active residents count using settings max residents for display
    const potentialCapacity = tenants.reduce((acc, t) => acc + (t.settings?.maxResidents || 0), 0);

    const STATUS_COLORS: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        pending: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
        suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
        trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-8 h-8 mx-auto border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-white/50">Loading tenants...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                <p className="text-red-400 mb-2 font-medium">Error Loading Data</p>
                <p className="text-white/60 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                            <Building2 className="w-5 h-5 text-fuchsia-400" />
                        </div>
                        Organization <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Tenants</span>
                    </h2>
                    <p className="text-sm text-white/50 mt-1 pl-13">Manage and monitor all platform organizations.</p>
                </div>

                <div className="flex gap-3">
                    <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Provision New Tenant
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-white/50">Total Tenants</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{tenants.length}</h3>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Globe className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        {activeCount} active organizations
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-white/50">System Capacity</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{potentialCapacity.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Users className="w-5 h-5 text-fuchsia-400" />
                        </div>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                        Total configured resident capacity
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-white/50">System Health</p>
                            <h3 className="text-3xl font-bold text-emerald-400 mt-1">99.9%</h3>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-xs text-emerald-400/70 mt-2">
                        Platform operational
                    </p>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-white/30" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search organizations by name or slug..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-black/20 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Organization</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Capacity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Created</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-white/40">
                                        No organizations found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr
                                        key={tenant.id}
                                        className="hover:bg-white/5 transition-colors group relative border-l-2 border-transparent hover:border-fuchsia-500"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white/80 font-bold">
                                                    {tenant.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{tenant.name || 'Untitled Organization'}</div>
                                                    <div className="text-sm text-white/40">{tenant.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[tenant.status] || STATUS_COLORS.inactive}`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                            {tenant.settings?.maxResidents ? `${tenant.settings.maxResidents} seats` : 'Unlimited'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                            {tenant.createdAt ? new Date((tenant.createdAt as unknown as { _seconds?: number })._seconds ? (tenant.createdAt as unknown as { _seconds: number })._seconds * 1000 : tenant.createdAt as unknown as string | number).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/admin/tenants/${tenant.id}`} className="text-fuchsia-400 hover:text-fuchsia-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Manage<span className="sr-only">, {tenant.name}</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
