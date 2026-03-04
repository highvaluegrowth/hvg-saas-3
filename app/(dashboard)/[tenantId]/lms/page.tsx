'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
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
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(`/api/tenants/${resolvedParams.tenantId}/lms/courses`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your recovery courses and curriculum.</p>
                </div>
                <Link
                    href={`/${resolvedParams.tenantId}/lms/create`}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
                >
                    Create Course
                </Link>
            </div>

            {loading && (
                <div className="py-12 text-center">
                    <p className="text-muted-foreground">Loading courses...</p>
                </div>
            )}

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="border border-border bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                            <div className="flex gap-2 mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${course.isPublic ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {course.isPublic ? 'Public' : 'Residents Only'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {course.published ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/${resolvedParams.tenantId}/lms/${course.id}/builder`}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Builder
                                </Link>
                                <Link
                                    href={`/${resolvedParams.tenantId}/lms/${course.id}/analytics`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline ml-auto"
                                >
                                    Analytics
                                </Link>
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                            <p className="text-muted-foreground">No courses created yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
