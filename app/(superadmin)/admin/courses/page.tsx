'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { CourseDoc } from '@/features/lms/services/courseService';
import { GraduationCap, Globe, Shield, Search, BookOpen, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    async function fetchCourses() {
        setLoading(true);
        try {
            const token = await authService.getIdToken();
            const res = await fetch('/api/admin/courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch courses');
            const data = await res.json();
            setCourses(data.courses || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading courses');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchCourses();
    }, [user]);

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ownerTenantId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-white italic">Global Course Library</h1>
                    <p className="text-slate-400 text-sm mt-1">Monitor, moderate, and manage curriculum across the entire platform.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-slate-400">
                    {courses.length} TOTAL COURSES
                </div>
            </div>

            {/* Search & Stats */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-white/20" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses by title or organization..."
                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-left">Course Details</th>
                                <th className="px-6 py-4 text-left">Organization / Owner</th>
                                <th className="px-6 py-4 text-left">Visibility</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Curriculum</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-white/5 rounded-xl w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">No courses found matching your criteria.</td>
                                </tr>
                            ) : filteredCourses.map(course => (
                                <tr key={course.id} className="hover:bg-white/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                                                <BookOpen className="w-5 h-5 text-fuchsia-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-fuchsia-400 transition-colors">{course.title}</div>
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
                                                <Globe className="w-3 h-3" />
                                                Universal
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                <Shield className="w-3 h-3" />
                                                Tenant Only
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                                            course.published 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
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
                                            Updated {new Date(course.updatedAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-all border border-white/10"
                                                title="View Curriculum"
                                            >
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
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
