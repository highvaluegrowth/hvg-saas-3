'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { CourseDoc } from '@/features/lms/services/courseService';
import { Globe, Shield, Search, BookOpen, Clock, ChevronRight } from 'lucide-react';

export default function SuperAdminCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchCourses() {
            if (!user) return;
            setLoading(true);
            try {
                const token = await authService.getIdToken();
                const res = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch courses');
                const data = await res.json();
                setCourses(data.courses || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, [user]);

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ownerTenantId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Global Course Library</h1>
                    <p className="text-slate-400 text-sm mt-1">Monitor, moderate, and manage curriculum across the entire platform.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400">
                    {courses.length} TOTAL COURSES
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
                    placeholder="Search courses by title or organization..."
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                {['Course Details', 'Organization', 'Visibility', 'Status', 'Curriculum', 'Actions'].map(h => (
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
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">No courses found.</td></tr>
                            ) : filtered.map(course => (
                                <tr key={course.id} className="hover:bg-white/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                                <BookOpen className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{course.title}</div>
                                                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{course.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-[10px] text-slate-400">{course.ownerTenantId}</div>
                                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Organization ID</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {course.visibility === 'universal' ? (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-cyan-400 uppercase tracking-tighter">
                                                <Globe className="w-3 h-3" /> Universal
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                <Shield className="w-3 h-3" /> Tenant Only
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${course.published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                            {course.published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-bold text-white">{course.curriculum?.length || 0}</div>
                                            <div className="text-[9px] text-slate-500 uppercase font-black">Modules</div>
                                        </div>
                                        <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            {new Date(course.updatedAt).toLocaleDateString()}
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
