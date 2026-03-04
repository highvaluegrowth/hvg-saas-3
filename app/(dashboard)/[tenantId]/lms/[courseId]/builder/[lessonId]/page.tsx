'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { RichTextEditor } from '@/components/lms/RichTextEditor';
import { QuizQuestionBuilder } from '@/components/lms/quiz/QuizQuestionBuilder';
import { QuizQuestion } from '@/types/lms/course';
import { LessonDoc } from '@/features/lms/services/lessonService';

type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ';

export default function LessonEditorPage({
    params,
}: {
    params: Promise<{ tenantId: string; courseId: string; lessonId: string }>;
}) {
    const resolvedParams = React.use(params);
    const { tenantId, courseId, lessonId } = resolvedParams;

    const [lessonType, setLessonType] = useState<LessonType>('TEXT');
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [content, setContent] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Derive embed URL from various video hosting formats
    const getEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        // Mux
        if (url.includes('mux.com') || url.startsWith('https://stream.mux.com')) return url;
        return null;
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(
                    `/api/tenants/${tenantId}/lms/courses/${courseId}/lessons/${lessonId}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error ?? `Request failed: ${res.status}`);
                }
                const data = await res.json();
                if (!cancelled && data.lesson) {
                    const l: LessonDoc = data.lesson;
                    setLessonType(l.type);
                    setTitle(l.title || '');
                    setVideoUrl(l.videoUrl || '');
                    setThumbnailUrl(l.thumbnailUrl || '');
                    setContent(l.content || '');
                    setQuestions(l.questions || []);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [tenantId, courseId, lessonId]);

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaved(false);
        try {
            const token = await auth.currentUser?.getIdToken();
            const body: Partial<LessonDoc> = {
                title,
                type: lessonType,
                ...(lessonType === 'VIDEO' ? { videoUrl, thumbnailUrl } : {}),
                ...(lessonType === 'TEXT' ? { content } : {}),
                ...(lessonType === 'QUIZ' ? { questions } : {}),
            };
            const res = await fetch(
                `/api/tenants/${tenantId}/lms/courses/${courseId}/lessons/${lessonId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? `Request failed: ${res.status}`);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    };

    const addQuestion = useCallback(() => {
        setQuestions(prev => [
            ...prev,
            { id: 'q-' + Date.now(), type: 'MULTIPLE_CHOICE', questionText: '', points: 1 },
        ]);
    }, []);

    const updateQuestion = useCallback((i: number, updated: QuizQuestion) => {
        setQuestions(prev => prev.map((q, idx) => idx === i ? updated : q));
    }, []);

    const deleteQuestion = useCallback((i: number) => {
        setQuestions(prev => prev.filter((_, idx) => idx !== i));
    }, []);

    const embedUrl = lessonType === 'VIDEO' ? getEmbedUrl(videoUrl) : null;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading lesson...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href={`/${tenantId}/lms/${courseId}/builder`}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                    >
                        ← Back to Course Builder
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Lesson Editor</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        <span className="capitalize bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium mr-2">{lessonType}</span>
                        Configure this lesson's content.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>}
                    {saveError && <span className="text-sm text-destructive">{saveError}</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Lesson'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {error}
                </div>
            )}

            {/* Title */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <label className="text-sm font-medium block">Lesson Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2 border border-border bg-background rounded-md"
                    placeholder="e.g. Introduction to Step 1"
                />
            </div>

            {/* VIDEO */}
            {lessonType === 'VIDEO' && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold">Video Content</h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Video URL</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            placeholder="YouTube, Vimeo, or Mux URL"
                        />
                        <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, and Mux stream URLs.</p>
                    </div>
                    {embedUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden border border-border">
                            <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        </div>
                    )}
                    {videoUrl && !embedUrl && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                            URL format not recognized. Preview unavailable. Direct links (mp4, m3u8) will still play in the mobile app.
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thumbnail URL (optional)</label>
                        <input
                            type="url"
                            value={thumbnailUrl}
                            onChange={e => setThumbnailUrl(e.target.value)}
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            )}

            {/* TEXT */}
            {lessonType === 'TEXT' && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                    <h2 className="font-semibold">Text Content</h2>
                    <RichTextEditor content={content} onChange={setContent} />
                </div>
            )}

            {/* QUIZ */}
            {lessonType === 'QUIZ' && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Quiz Questions</h2>
                        <span className="text-sm text-muted-foreground">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                    </div>

                    {questions.length === 0 && (
                        <div className="py-8 border-2 border-dashed border-border rounded-xl text-center">
                            <p className="text-muted-foreground text-sm">No questions yet. Add your first question below.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {questions.map((q, i) => (
                            <QuizQuestionBuilder
                                key={q.id}
                                question={q}
                                onChange={updated => updateQuestion(i, updated)}
                                onDelete={() => deleteQuestion(i)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                    >
                        + Add Question
                    </button>
                </div>
            )}
        </div>
    );
}
