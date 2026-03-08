'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { CourseDoc } from '@/features/lms/services/courseService';

export default function LMSDashboard({ params }: { params: Promise<{ tenantId: string }> }) {
    const resolvedParams = React.use(params);
    const [courses, setCourses] = useState<CourseDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchCourses() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch(`/api/tenants/${resolvedParams.tenantId}/lms/courses`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error ?? `Request failed: ${res.status}`);
                }
                const data = await res.json();
                if (!cancelled) setCourses(data.courses ?? []);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchCourses();
        return () => { cancelled = true; };
    }, [resolvedParams.tenantId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Learning Management</h1>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Manage your recovery courses and curriculum.</p>
                </div>
                <Link
                    href={`/${resolvedParams.tenantId}/lms/create`}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                    Create Course
                </Link>
            </div>

            {loading && (
                <div className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Loading courses...
                </div>
            )}

            {error && (
                <div className="text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-md p-3">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="rounded-xl p-5 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 className="font-semibold text-lg mb-2 text-white">{course.title}</h3>
                            <div className="flex gap-2 mb-4">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={course.isPublic ? { background: 'rgba(8,145,178,0.25)', color: '#67E8F9' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                                    {course.isPublic ? 'Public' : 'Residents Only'}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={course.published ? { background: 'rgba(16,185,129,0.25)', color: '#6EE7B7' } : { background: 'rgba(245,158,11,0.25)', color: '#FCD34D' }}>
                                    {course.published ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/${resolvedParams.tenantId}/lms/${course.id}/builder`}
                                    className="text-sm font-medium transition-colors hover:underline" style={{ color: '#67E8F9' }}
                                >
                                    Builder
                                </Link>
                                <Link
                                    href={`/${resolvedParams.tenantId}/lms/${course.id}/analytics`}
                                    className="text-sm font-medium hover:text-white hover:underline ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }}
                                >
                                    Analytics
                                </Link>
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && (
                        <div className="col-span-full rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="text-center py-16">
                                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4" style={{ background: 'rgba(8,145,178,0.15)' }}>
                                    <svg className="w-8 h-8" style={{ color: '#67E8F9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-1 text-white">No courses yet</h3>
                                <p className="mb-6 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Create your first course to begin building curriculum.</p>
                                <Link
                                    href={`/${resolvedParams.tenantId}/lms/create`}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors inline-block"
                                >
                                    Create First Course
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
