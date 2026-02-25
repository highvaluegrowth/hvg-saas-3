'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCoursePage({ params }: { params: Promise<{ tenantId: string }> }) {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: Create Firestore doc in 'courses' collection
        // const newDocRef = await addDoc(collection(db, 'courses'), { title, description, isPublic, ownerTenantId: resolvedParams.tenantId });
        const mockId = 'new-course-' + Date.now();
        router.push(`/${resolvedParams.tenantId}/lms/${mockId}/builder`);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
                <p className="text-muted-foreground mt-1">Configure the global settings for your new curriculum.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Course Title</label>
                    <input
                        id="title"
                        required
                        type="text"
                        className="w-full p-2 border border-border bg-background rounded-md"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. 12-Step Foundations"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Short Description</label>
                    <textarea
                        id="description"
                        rows={3}
                        className="w-full p-2 border border-border bg-background rounded-md resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What will residents learn from this course?"
                    />
                </div>

                <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-lg border border-border">
                    <input
                        id="public"
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                        <label htmlFor="public" className="font-medium inline-block">Universal Access (Public)</label>
                        <p className="text-sm text-muted-foreground">If checked, non-residents reading this app globally can enroll and take this course.</p>
                    </div>
                </div>

                <button
                    disabled={loading || !title}
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create & Open Builder'}
                </button>
            </form>
        </div>
    );
}
