'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/lms/RichTextEditor';
import { QuizQuestionBuilder } from '@/components/lms/quiz/QuizQuestionBuilder';
import { QuizQuestion } from '@/types/lms/course';

export default function LessonEditorPage({ params }: { params: Promise<{ tenantId: string, courseId: string, lessonId: string }> }) {
    const router = useRouter();
    const resolvedParams = React.use(params);

    // Mock Data that would be fetched from Firestore based on params.lessonId
    const [title, setTitle] = useState('New Lesson');
    const [type, setType] = useState<'VIDEO' | 'TEXT' | 'QUIZ'>('TEXT');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState(''); // E.g., mux playback id or youtube url
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [saving, setSaving] = useState(false);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: 'q-' + Date.now(),
                type: 'MULTIPLE_CHOICE',
                questionText: '<p>What is the correct answer?</p>',
                points: 10,
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A'
            }
        ]);
    };

    const handleUpdateQuestion = (updated: QuizQuestion) => {
        setQuestions(questions.map(q => q.id === updated.id ? updated : q));
    };

    const handleDeleteQuestion = (qId: string) => {
        setQuestions(questions.filter(q => q.id !== qId));
    };

    const handleSave = () => {
        setSaving(true);
        // Write lesson data back to Firestore
        setTimeout(() => {
            setSaving(false);
            alert('Lesson saved successfully!');
            router.push(`/${resolvedParams.tenantId}/lms/${resolvedParams.courseId}/builder`);
        }, 800);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header & Navigation */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <Link href={`/${resolvedParams.tenantId}/lms/${resolvedParams.courseId}/builder`} className="hover:text-foreground transition-colors">
                    &larr; Back to Builder
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">Edit Lesson</span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0"
                        placeholder="Lesson Title"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Lesson'}
                </button>
            </div>

            {/* Editor Main Content Area */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-8">

                {/* Type Selector */}
                <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold">Lesson Type</label>
                    <div className="flex gap-4">
                        {(['VIDEO', 'TEXT', 'QUIZ'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${type === t
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                                    }`}
                            >
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <hr className="border-border" />

                {/* Dynamic Editors based on Type */}
                {type === 'TEXT' && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Lesson Content (Text)</label>
                        <RichTextEditor content={content} onChange={setContent} />
                    </div>
                )}

                {type === 'VIDEO' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Video URL / Mux ID</label>
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="w-full p-2 border border-border bg-background rounded-md text-sm"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Optional Description Below Video</label>
                            <RichTextEditor content={content} onChange={setContent} />
                        </div>
                    </div>
                )}

                {type === 'QUIZ' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold">Quiz Questions</h3>
                                <p className="text-xs text-muted-foreground mt-1">Add evaluated questions to enforce comprehension.</p>
                            </div>
                            <button
                                onClick={handleAddQuestion}
                                className="text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium"
                            >
                                + Add Question
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="relative">
                                    <div className="absolute -left-3 -top-3 w-6 h-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold z-10 shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <QuizQuestionBuilder
                                        question={q}
                                        onChange={handleUpdateQuestion}
                                        onDelete={() => handleDeleteQuestion(q.id)}
                                    />
                                </div>
                            ))}

                            {questions.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                                    <p className="text-sm text-muted-foreground">No questions added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
