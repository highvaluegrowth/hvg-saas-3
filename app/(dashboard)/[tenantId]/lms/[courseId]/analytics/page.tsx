'use client';

import React from 'react';

export default function CourseAnalyticsPage({ params }: { params: Promise<{ tenantId: string, courseId: string }> }) {
    const resolvedParams = React.use(params);
    // Demo Data
    const stats = [
        { label: 'Total Enrolled', value: '42', color: 'text-blue-600' },
        { label: 'Completion Rate', value: '68%', color: 'text-emerald-600' },
        { label: 'Average Score', value: '88/100', color: 'text-cyan-600' },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics: Course Progress</h1>
                <p className="text-muted-foreground mt-1 text-sm">Monitor how your residents are doing in this course.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{s.label}</h3>
                        <span className={`text-4xl font-bold ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold text-sm">Resident Progress</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Resident</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Progress</th>
                                <th className="px-6 py-3 font-medium text-right">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-medium">John Doe</td>
                                <td className="px-6 py-4"><span className="!bg-emerald-100 !text-emerald-700 px-2 py-1 rounded-full text-xs">Completed</span></td>
                                <td className="px-6 py-4">100%</td>
                                <td className="px-6 py-4 text-right text-muted-foreground">Today</td>
                            </tr>
                            <tr className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-medium">Jane Smith</td>
                                <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">In Progress</span></td>
                                <td className="px-6 py-4">40%</td>
                                <td className="px-6 py-4 text-right text-muted-foreground">Yesterday</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
