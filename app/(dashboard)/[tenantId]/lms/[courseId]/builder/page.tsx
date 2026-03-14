'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SortableList, SortableItemType } from '@/components/lms/SortableList';
import Link from 'next/link';
import { authService } from '@/features/auth/services/authService';

// Mock types for the local state representation
type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';

interface LocalLesson {
    id: string;
    title: string;
    type: LessonType;
}

interface LocalModule {
    id: string;
    title: string;
    lessons: LocalLesson[];
}

export default function CourseBuilderPage({ params }: { params: Promise<{ tenantId: string, courseId: string }> }) {
    const resolvedParams = React.use(params);
    const [modules, setModules] = useState<LocalModule[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Refs to guard auto-save: don't fire during initial load or concurrent saves
    const hasLoadedRef = useRef(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingRef = useRef(false);

    // Load course curriculum from Firestore on mount
    useEffect(() => {
        hasLoadedRef.current = false;
        let cancelled = false;
        async function loadCourse() {
            try {
                const token = await authService.getIdToken();
                const res = await fetch(
                    `/api/tenants/${resolvedParams.tenantId}/lms/courses/${resolvedParams.courseId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error ?? `Request failed: ${res.status}`);
                }
                const data = await res.json();
                const curriculum = data.course?.curriculum;
                if (!cancelled && Array.isArray(curriculum) && curriculum.length > 0) {
                    // Map CurriculumModule[] -> LocalModule[]
                    const loaded: LocalModule[] = curriculum.map((m: { id: string; title: string; lessons: { id: string; title: string; type: string }[] }) => ({
                        id: m.id,
                        title: m.title,
                        lessons: (m.lessons ?? []).map((l: { id: string; title: string; type: string }) => ({
                            id: l.id,
                            title: l.title,
                            type: (l.type as LessonType) || 'TEXT',
                        })),
                    }));
                    setModules(loaded);
                }
            } catch (err) {
                if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) {
                    // Small delay so the setModules state update settles before we enable auto-save
                    setTimeout(() => { hasLoadedRef.current = true; }, 300);
                }
            }
        }
        loadCourse();
        return () => { cancelled = true; };
    }, [resolvedParams.tenantId, resolvedParams.courseId]);

    const handleAddModule = () => {
        const newMod = { id: 'm-' + Date.now(), title: 'New Module', lessons: [] };
        setModules([...modules, newMod]);
    };

    const handleDeleteModule = (modId: string) => {
        setModules(modules.filter(m => m.id !== modId));
    };

    const handleAddLesson = (modId: string, type: LessonType) => {
        setModules(modules.map(m => {
            if (m.id === modId) {
                return {
                    ...m,
                    lessons: [...m.lessons, { id: 'l-' + Date.now(), title: `New ${type} Lesson`, type }]
                };
            }
            return m;
        }));
    };

    const handleDeleteLesson = (modId: string, lessonId: string) => {
        setModules(modules.map(m => {
            if (m.id === modId) {
                return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
            }
            return m;
        }));
    };

    const handleUpdateModuleTitle = (modId: string, newTitle: string) => {
        setModules(modules.map(m => m.id === modId ? { ...m, title: newTitle } : m));
    };

    const handleSave = useCallback(async (isAutoSave = false) => {
        if (savingRef.current) return;
        savingRef.current = true;
        if (!isAutoSave) {
            setSaving(true);
            setSaveError(null);
            setSaved(false);
        }
        try {
            const token = await authService.getIdToken();
            const curriculum = modules.map((m, i) => ({
                id: m.id,
                title: m.title,
                order: i,
                lessons: m.lessons.map((l, j) => ({
                    id: l.id,
                    title: l.title,
                    type: l.type,
                    order: j,
                })),
            }));
            const res = await fetch(
                `/api/tenants/${resolvedParams.tenantId}/lms/courses/${resolvedParams.courseId}/curriculum`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ curriculum }),
                }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? `Request failed: ${res.status}`);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            if (!isAutoSave) setSaveError(err instanceof Error ? err.message : String(err));
        } finally {
            savingRef.current = false;
            if (!isAutoSave) setSaving(false);
        }
    }, [modules, resolvedParams.tenantId, resolvedParams.courseId]);

    // Auto-save curriculum 1.5 s after any change (debounced), but only after initial load
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            handleSave(true);
        }, 1500);
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [modules, handleSave]);

    // Convert our nested state to the generic format the SortableList expects
    const sortableItems: SortableItemType[] = modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        actions: (
            <button
                onClick={() => handleDeleteModule(mod.id)}
                className="text-destructive hover:bg-destructive/10 p-1.5 rounded"
                title="Delete Module"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </button>
        ),
        content: (
            <div className="space-y-3">
                {/* Inline Edit Module Title */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleUpdateModuleTitle(mod.id, e.target.value)}
                        className="w-full text-sm p-2 border border-border bg-background rounded focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Module Title"
                    />
                </div>

                {/* Lessons List */}
                {mod.lessons.length > 0 ? (
                    <div className="space-y-2">
                        {mod.lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-secondary/20 border border-border rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                        {idx + 1}. {lesson.type}
                                    </span>
                                    <span className="text-sm font-medium">{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Edit Lesson Content Button - Routes to dedicated Lesson Editor */}
                                    <Link
                                        href={`/${resolvedParams.tenantId}/lms/${resolvedParams.courseId}/builder/${lesson.id}?type=${lesson.type}`}
                                        className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                        className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic mb-2">No lessons in this module.</p>
                )}

                {/* Add Lesson Controls */}
                <div className="pt-2 flex flex-wrap gap-2">
                    <button onClick={() => handleAddLesson(mod.id, 'VIDEO')} className="text-xs bg-muted hover:bg-secondary border border-border px-3 py-1.5 rounded font-medium transition-colors">
                        🎬 Video
                    </button>
                    <button onClick={() => handleAddLesson(mod.id, 'TEXT')} className="text-xs bg-muted hover:bg-secondary border border-border px-3 py-1.5 rounded font-medium transition-colors">
                        📝 Text
                    </button>
                    <button onClick={() => handleAddLesson(mod.id, 'QUIZ')} className="text-xs bg-muted hover:bg-secondary border border-border px-3 py-1.5 rounded font-medium transition-colors">
                        📋 Quiz
                    </button>
                    <button onClick={() => handleAddLesson(mod.id, 'SLIDES')} className="text-xs bg-muted hover:bg-secondary border border-border px-3 py-1.5 rounded font-medium transition-colors">
                        🖼️ Slides
                    </button>
                </div>
            </div>
        )
    }));

    const handleSortModules = (reorderedMapped: SortableItemType[]) => {
        // Reconstruct the modules array from the sorted ID list
        const sortedIds = reorderedMapped.map(item => item.id);
        const sortedModules = sortedIds.map(id => modules.find(m => m.id === id)!).filter(Boolean);
        setModules(sortedModules);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Curriculum Builder</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Organize modules, add lessons, and configure your course structure.</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-sm text-emerald-600 font-medium">✓ Structure saved</span>
                    )}
                    {saveError && (
                        <span className="text-sm text-destructive">{saveError}</span>
                    )}
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Structure'}
                    </button>
                </div>
            </div>

            {/* ── Info Banner: Two separate save actions ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                    <p className="font-semibold text-blue-800">Two separate save actions</p>
                    <p className="text-blue-700 mt-0.5">
                        <strong>&quot;Save Structure&quot;</strong> (this page) only saves module names and lesson order.
                        {' '}To save slide images, video URLs, text content, or quiz questions — click the{' '}
                        <strong>✏️ pencil icon</strong> next to any lesson to open the Lesson Editor, then click{' '}
                        <strong>&quot;Save Lesson&quot;</strong> inside that editor.
                    </p>
                </div>
            </div>

            {loadError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {loadError}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Modules</h2>
                    <button
                        onClick={handleAddModule}
                        className="text-sm border border-border bg-background hover:bg-secondary text-foreground px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                        + Add Module
                    </button>
                </div>

                <SortableList
                    items={sortableItems}
                    onReorder={handleSortModules}
                />

                {modules.length === 0 && (
                    <div className="py-12 border-2 text-center border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground">This course has no modules yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
