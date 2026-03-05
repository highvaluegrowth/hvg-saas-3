'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';
import { RichTextEditor } from '@/components/lms/RichTextEditor';
import { QuizQuestionBuilder } from '@/components/lms/quiz/QuizQuestionBuilder';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { QuizQuestion } from '@/types/lms/course';
import { LessonDoc, SlideItem } from '@/features/lms/services/lessonService';

type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';

// ─── Slides Editor ────────────────────────────────────────────────────────────

function SlidesEditor({
    slides,
    onChange,
    tenantId,
    courseId,
    lessonId,
}: {
    slides: SlideItem[];
    onChange: (s: SlideItem[]) => void;
    tenantId: string;
    courseId: string;
    lessonId: string;
}) {
    const addSlide = () => {
        onChange([...slides, { id: 's-' + Date.now(), imageUrl: '', caption: '' }]);
    };
    const removeSlide = (i: number) => onChange(slides.filter((_, idx) => idx !== i));
    const moveSlide = (i: number, dir: -1 | 1) => {
        const next = [...slides];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };
    const updateSlide = (i: number, field: keyof SlideItem, value: string) => {
        onChange(slides.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    };

    return (
        <div className="space-y-4">
            {slides.length === 0 && (
                <div className="py-10 border-2 border-dashed border-border rounded-xl text-center">
                    <p className="text-muted-foreground text-sm">No slides yet. Add your first slide below.</p>
                </div>
            )}
            {slides.map((slide, i) => (
                <div key={slide.id} className="border border-border rounded-xl p-4 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slide {i + 1}</span>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0}
                                className="text-xs px-2 py-1 border border-border rounded disabled:opacity-30 hover:bg-secondary">↑</button>
                            <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}
                                className="text-xs px-2 py-1 border border-border rounded disabled:opacity-30 hover:bg-secondary">↓</button>
                            <button type="button" onClick={() => removeSlide(i)}
                                className="text-xs px-2 py-1 text-destructive border border-destructive/30 rounded hover:bg-destructive/10">Remove</button>
                        </div>
                    </div>

                    {/* Image upload — replaces manual URL entry */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Slide Image</label>
                        <ImageUpload
                            storagePath={`tenants/${tenantId}/courses/${courseId}/slides/${lessonId}_slide${i}_${slide.id}`}
                            currentUrl={slide.imageUrl || undefined}
                            onUpload={(url) => updateSlide(i, 'imageUrl', url)}
                        />
                        {/* Fallback URL input */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">or paste URL:</span>
                            <input
                                type="url"
                                value={slide.imageUrl}
                                onChange={e => updateSlide(i, 'imageUrl', e.target.value)}
                                className="flex-1 p-1.5 border border-border bg-background rounded-md text-xs"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Caption <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={slide.caption || ''}
                            onChange={e => updateSlide(i, 'caption', e.target.value)}
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            placeholder="Describe this slide for learners..."
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addSlide}
                className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
                + Add Slide
            </button>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LessonEditorPage({
    params,
    searchParams,
}: {
    params: Promise<{ tenantId: string; courseId: string; lessonId: string }>;
    searchParams: Promise<{ type?: string }>;
}) {
    const resolvedParams = React.use(params);
    const resolvedSearch = React.use(searchParams);
    const { tenantId, courseId, lessonId } = resolvedParams;

    const validTypes: LessonType[] = ['VIDEO', 'TEXT', 'QUIZ', 'SLIDES'];
    const initialType: LessonType = validTypes.includes(resolvedSearch?.type as LessonType)
        ? (resolvedSearch.type as LessonType)
        : 'TEXT';

    const [lessonType, setLessonType] = useState<LessonType>(initialType);
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [content, setContent] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [slides, setSlides] = useState<SlideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Track whether content has been loaded and changed (for auto-save guard)
    const hasLoadedRef = useRef(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingRef = useRef(false);

    const getEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        if (url.includes('mux.com') || url.startsWith('https://stream.mux.com')) return url;
        return null;
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch(
                    `/api/tenants/${tenantId}/lms/courses/${courseId}/lessons/${lessonId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
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
                    setSlides(l.slides || []);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    // Allow auto-save after a brief delay so initial setState doesn't trigger it
                    setTimeout(() => { hasLoadedRef.current = true; }, 500);
                }
            }
        }
        load();
        return () => {
            cancelled = true;
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [tenantId, courseId, lessonId]);

    const doSave = useCallback(async (isAutoSave = false) => {
        if (savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        setSaveError(null);
        if (!isAutoSave) setSaved(false);
        try {
            const token = await authService.getIdToken();
            const body: Partial<LessonDoc> = {
                title,
                type: lessonType,
                ...(lessonType === 'VIDEO' ? { videoUrl, thumbnailUrl } : {}),
                ...(lessonType === 'TEXT' ? { content } : {}),
                ...(lessonType === 'QUIZ' ? { questions } : {}),
                ...(lessonType === 'SLIDES' ? { slides } : {}),
            };
            const res = await fetch(
                `/api/tenants/${tenantId}/lms/courses/${courseId}/lessons/${lessonId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? `Request failed: ${res.status}`);
            }
            setSaved(true);
            setLastSaved(new Date());
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
            savingRef.current = false;
        }
    }, [title, lessonType, videoUrl, thumbnailUrl, content, questions, slides, tenantId, courseId, lessonId]);

    // Auto-save: debounce 3 seconds after any content change
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            doSave(true);
        }, 3000);
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [title, videoUrl, thumbnailUrl, content, questions, slides, doSave]);

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

    const TYPE_LABELS: Record<LessonType, string> = {
        VIDEO: '🎬 Video', TEXT: '📝 Text', QUIZ: '📋 Quiz', SLIDES: '🖼️ Slides',
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading lesson...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto pb-28 space-y-6">
            {/* Header */}
            <div>
                <Link
                    href={`/${tenantId}/lms/${courseId}/builder`}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                >
                    ← Back to Course Builder
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Lesson Editor</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            <span className="capitalize bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium mr-2">
                                {TYPE_LABELS[lessonType]}
                            </span>
                            Edit content and click <strong>Save Lesson</strong> when done.
                        </p>
                    </div>
                    {/* Auto-save status indicator */}
                    {lastSaved && !saving && (
                        <span className="text-xs text-muted-foreground">
                            Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {error}
                </div>
            )}

            {/* Lesson Title */}
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
                            URL format not recognized for preview. Direct links (mp4, m3u8) will still play in the mobile app.
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thumbnail (optional)</label>
                        <ImageUpload
                            storagePath={`tenants/${tenantId}/courses/${courseId}/lessons/${lessonId}/thumbnail`}
                            onUpload={(url) => setThumbnailUrl(url)}
                            currentUrl={thumbnailUrl || undefined}
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

            {/* SLIDES */}
            {lessonType === 'SLIDES' && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Slide Deck</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Upload images or paste URLs. Learners swipe through slides in order.
                            </p>
                        </div>
                        <span className="text-sm text-muted-foreground">{slides.length} slide{slides.length !== 1 ? 's' : ''}</span>
                    </div>
                    <SlidesEditor
                        slides={slides}
                        onChange={setSlides}
                        tenantId={tenantId}
                        courseId={courseId}
                        lessonId={lessonId}
                    />
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

            {/* ── Sticky Save Footer ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    {saving && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Saving…
                        </div>
                    )}
                    {saved && !saving && (
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Lesson saved
                        </span>
                    )}
                    {saveError && !saving && (
                        <span className="text-sm text-destructive">{saveError}</span>
                    )}
                    {!saving && !saved && !saveError && lastSaved && (
                        <span className="text-xs text-muted-foreground">
                            Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {!saving && !saved && !saveError && !lastSaved && (
                        <span className="text-xs text-muted-foreground">Unsaved changes auto-save after 3 seconds of inactivity</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/${tenantId}/lms/${courseId}/builder`}
                        className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-md border border-border hover:bg-secondary transition-colors"
                    >
                        ← Back
                    </Link>
                    <button
                        onClick={() => doSave(false)}
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                    >
                        {saving ? 'Saving…' : 'Save Lesson'}
                    </button>
                </div>
            </div>
        </div>
    );
}
