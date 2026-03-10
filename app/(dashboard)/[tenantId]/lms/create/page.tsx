'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';

export default function CreateCoursePage({ params }: { params: Promise<{ tenantId: string }> }) {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/tenants/${resolvedParams.tenantId}/lms/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, description, isPublic }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? `Request failed: ${res.status}`);
            }
            const data = await res.json();
            router.push(`/${resolvedParams.tenantId}/lms/${data.course.id}/builder`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Create New Course</h1>
                <p className="text-white/50 mt-1 text-sm">Configure the global settings for your new curriculum.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-xl shadow-sm">
                {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-white/80">Course Title</label>
                    <input
                        id="title"
                        required
                        type="text"
                        className="w-full p-2 border border-white/10 bg-white/5 text-white placeholder-white/40 rounded-md focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 12-Step Foundations"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-white/80">Short Description</label>
                    <textarea
                        id="description"
                        rows={3}
                        className="w-full p-2 border border-white/10 bg-white/5 text-white placeholder-white/40 rounded-md resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What will residents learn from this course?"
                    />
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
                    <input
                        id="public"
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 bg-black/20 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label htmlFor="public" className="font-medium inline-block text-white/90">Universal Access (Public)</label>
                        <p className="text-sm text-white/50">If checked, non-residents reading this app globally can enroll and take this course.</p>
                    </div>
                </div>

                <button
                    disabled={loading || !title}
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Creating...' : 'Create & Open Builder'}
                </button>
            </form>
        </div>
    );
}
