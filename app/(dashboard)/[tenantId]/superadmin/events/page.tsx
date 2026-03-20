'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { CalendarDays, MapPin, Users, Globe, Shield, Home, Search, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

function getSafeDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function SuperAdminEventsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchEvents() {
            if (!user) return;
            setLoading(true);
            try {
                const token = await authService.getIdToken();
                const res = await fetch('/api/admin/events', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch events');
                const data = await res.json();
                setEvents(data.events || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [user]);

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tenantId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Global Event Oversight</h1>
                    <p className="text-slate-400 text-sm mt-1">Monitor community engagement and scheduled activities across all houses.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400">
                    {events.length} TOTAL EVENTS
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-white/20" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events by title or organization..."
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                {['Event Details', 'Schedule', 'Organization', 'Visibility', 'Attendees', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-white/5 rounded-xl w-full" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">No events found.</td></tr>
                            ) : filtered.map(event => (
                                <tr key={event.id} className="hover:bg-white/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                                <CalendarDays className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{event.title}</div>
                                                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.location || 'No location set'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-white">{format(getSafeDate(event.scheduledAt), 'MMM d, yyyy')}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(getSafeDate(event.scheduledAt), 'h:mm a')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-[10px] text-slate-400">{event.tenantId}</div>
                                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Organization ID</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {event.visibility === 'universal' ? (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-cyan-400 uppercase tracking-tighter"><Globe className="w-3 h-3" /> Universal</span>
                                        ) : event.visibility === 'house' ? (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-tighter"><Home className="w-3 h-3" /> House Only</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-tighter"><Shield className="w-3 h-3" /> Tenant Only</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-500" />
                                            <span className="text-xs font-bold text-white">{event.attendeeCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-all border border-white/10">
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
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
