'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';

interface EnrollmentRecord {
  id: string;
  userId: string;
  displayName?: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  enrolledAt?: string;
  lastAccessedAt?: string;
}

interface AnalyticsStats {
  total: number;
  completed: number;
  inProgress: number;
  enrolled: number;
  completionRate: number;
  averageScore: number | null;
  avgProgress: number;
}

export default function CourseAnalyticsPage({ params }: { params: Promise<{ tenantId: string; courseId: string }> }) {
  const resolvedParams = React.use(params);
  const { tenantId, courseId } = resolvedParams;

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(
          `/api/tenants/${tenantId}/lms/courses/${courseId}/analytics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setStats(data.stats);
          setEnrollments(data.enrollments || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tenantId, courseId]);

  const statusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'IN_PROGRESS') return 'bg-sky-100 text-sky-700';
    return 'bg-slate-100 text-slate-700';
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '\u2014';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${tenantId}/lms/${courseId}/builder`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            &larr; Back to Course Builder
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Course Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor how your residents are doing in this course.</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 h-32 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Enrolled</p>
              <span className="text-4xl font-bold text-blue-600">{stats.total}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Completion Rate</p>
              <span className="text-4xl font-bold text-emerald-600">{stats.completionRate}%</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Avg Progress</p>
              <span className="text-4xl font-bold text-cyan-600">{stats.avgProgress}%</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Avg Quiz Score</p>
              <span className="text-4xl font-bold text-violet-600">
                {stats.averageScore !== null ? `${stats.averageScore}%` : '\u2014'}
              </span>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Not Started', value: stats.enrolled, color: 'bg-slate-100 text-slate-700' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-sky-100 text-sky-700' },
              { label: 'Completed', value: stats.completed, color: 'bg-emerald-100 text-emerald-700' },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${s.color}`}>{s.value}</span>
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Resident table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Resident Progress</h2>
              <span className="text-xs text-muted-foreground">{enrollments.length} resident{enrollments.length !== 1 ? 's' : ''}</span>
            </div>
            {enrollments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">No residents enrolled yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Enrollments will appear here once residents are added to this course.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left align-middle">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Resident</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Progress</th>
                      <th className="px-6 py-3 font-medium">Enrolled</th>
                      <th className="px-6 py-3 font-medium text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map(e => (
                      <tr key={e.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">{e.displayName || e.userId}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(e.status)}`}>
                            {e.status === 'IN_PROGRESS' ? 'In Progress' : e.status === 'COMPLETED' ? 'Completed' : 'Not Started'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 min-w-[80px]">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${e.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{e.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDate(e.enrolledAt)}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">{formatDate(e.lastAccessedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : !error && (
        <div className="text-center py-12 text-muted-foreground">No data available.</div>
      )}
    </div>
  );
}
