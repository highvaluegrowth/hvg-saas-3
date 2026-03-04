'use client';

import React, { useState } from 'react';
import { QuizQuestion, QuestionType } from '@/types/lms/course';
import { RichTextEditor } from '../RichTextEditor';

interface QuizQuestionBuilderProps {
    question: QuizQuestion;
    onChange: (updated: QuizQuestion) => void;
    onDelete: () => void;
}

// ─── Helper: small reusable input/label ───────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium block">{label}</label>
            {children}
        </div>
    );
}

function TextInput({ value, onChange, placeholder, className = '' }: {
    value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
    return (
        <input
            type="text"
            className={`w-full p-2 border border-border bg-background rounded-md text-sm ${className}`}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    );
}

// ─── Type-specific config panels ──────────────────────────────────────────────

function FillInBlank({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">___</code> in the question prompt above to mark the blank.</p>
            <Field label="Correct Answer">
                <TextInput
                    value={question.correctAnswer as string || ''}
                    onChange={v => onChange({ ...question, correctAnswer: v })}
                    placeholder="e.g. mitochondria"
                />
            </Field>
        </div>
    );
}

function MatchingConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const pairs: Array<{ term: string; match: string }> = (question.metadata?.pairs as Array<{ term: string; match: string }>) || [];

    const updatePair = (i: number, field: 'term' | 'match', value: string) => {
        const next = pairs.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
        onChange({ ...question, metadata: { ...question.metadata, pairs: next } });
    };
    const addPair = () => {
        onChange({ ...question, metadata: { ...question.metadata, pairs: [...pairs, { term: '', match: '' }] } });
    };
    const removePair = (i: number) => {
        onChange({ ...question, metadata: { ...question.metadata, pairs: pairs.filter((_, idx) => idx !== i) } });
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Term</span><span>Matching Definition</span>
            </div>
            {pairs.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                    <TextInput value={p.term} onChange={v => updatePair(i, 'term', v)} placeholder="Term" />
                    <div className="flex gap-1">
                        <TextInput value={p.match} onChange={v => updatePair(i, 'match', v)} placeholder="Definition" />
                        <button onClick={() => removePair(i)} className="text-destructive hover:text-destructive/80 px-1 shrink-0">✕</button>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addPair}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Pair
            </button>
        </div>
    );
}

function EssayConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const maxWords = (question.metadata?.maxWords as number) || 0;
    const gradingNotes = (question.metadata?.gradingNotes as string) || '';
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">Essay responses are manually graded. Auto-scoring is not applied.</p>
            <Field label="Max Word Count (0 = unlimited)">
                <input
                    type="number"
                    min="0"
                    className="w-32 p-2 border border-border bg-background rounded-md text-sm"
                    value={maxWords}
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, maxWords: Number(e.target.value) } })}
                />
            </Field>
            <Field label="Grading Notes (for instructors only)">
                <textarea
                    rows={2}
                    className="w-full p-2 border border-border bg-background rounded-md text-sm resize-none"
                    value={gradingNotes}
                    placeholder="What key points should a complete answer include?"
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, gradingNotes: e.target.value } })}
                />
            </Field>
        </div>
    );
}

function OrderingConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const items: string[] = question.options || [];

    const updateItem = (i: number, value: string) => {
        const next = items.map((item, idx) => idx === i ? value : item);
        onChange({ ...question, options: next, correctAnswer: next });
    };
    const addItem = () => {
        const next = [...items, ''];
        onChange({ ...question, options: next, correctAnswer: next });
    };
    const removeItem = (i: number) => {
        const next = items.filter((_, idx) => idx !== i);
        onChange({ ...question, options: next, correctAnswer: next });
    };
    const moveItem = (i: number, dir: -1 | 1) => {
        const next = [...items];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        onChange({ ...question, options: next, correctAnswer: next });
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">List items in the correct order. Students will see them shuffled.</p>
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded shrink-0">{i + 1}</span>
                    <TextInput value={item} onChange={v => updateItem(i, v)} placeholder={`Item ${i + 1}`} />
                    <div className="flex flex-col gap-0.5 shrink-0">
                        <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="text-xs leading-none disabled:opacity-30">▲</button>
                        <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="text-xs leading-none disabled:opacity-30">▼</button>
                    </div>
                    <button type="button" onClick={() => removeItem(i)} className="text-destructive hover:text-destructive/80 text-sm shrink-0">✕</button>
                </div>
            ))}
            <button
                type="button"
                onClick={addItem}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Item
            </button>
        </div>
    );
}

function HotSpotConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const imageUrl = (question.metadata?.imageUrl as string) || '';
    const hs = (question.metadata?.hotspot as { x: number; y: number; width: number; height: number }) || { x: 0, y: 0, width: 10, height: 10 };

    const update = (field: string, value: string | number) => {
        onChange({ ...question, metadata: { ...question.metadata, [field]: value } });
    };
    const updateHs = (field: string, value: number) => {
        onChange({ ...question, metadata: { ...question.metadata, hotspot: { ...hs, [field]: value } } });
    };

    return (
        <div className="space-y-3">
            <Field label="Image URL">
                <TextInput value={imageUrl} onChange={v => update('imageUrl', v)} placeholder="https://..." />
            </Field>
            {imageUrl && (
                <div className="relative border border-border rounded-md overflow-hidden" style={{ maxHeight: 300 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Hot spot image" className="w-full object-contain" />
                    <div
                        className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                        style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.width}%`, height: `${hs.height}%` }}
                    />
                </div>
            )}
            <p className="text-xs text-muted-foreground">Define the correct click zone as % of image dimensions.</p>
            <div className="grid grid-cols-4 gap-2">
                {(['x', 'y', 'width', 'height'] as const).map(f => (
                    <Field key={f} label={f.toUpperCase()}>
                        <input
                            type="number" min="0" max="100"
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            value={hs[f]}
                            onChange={e => updateHs(f, Number(e.target.value))}
                        />
                    </Field>
                ))}
            </div>
        </div>
    );
}

function NumericalConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const tolerance = (question.metadata?.tolerance as number) ?? 0;
    return (
        <div className="space-y-3">
            <Field label="Correct Value">
                <input
                    type="number"
                    className="w-40 p-2 border border-border bg-background rounded-md text-sm"
                    value={question.correctAnswer as number || ''}
                    onChange={e => onChange({ ...question, correctAnswer: Number(e.target.value) })}
                    placeholder="42"
                />
            </Field>
            <Field label="Tolerance (± accepted range)">
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-40 p-2 border border-border bg-background rounded-md text-sm"
                    value={tolerance}
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, tolerance: Number(e.target.value) } })}
                    placeholder="0"
                />
            </Field>
            <p className="text-xs text-muted-foreground">A tolerance of 0.5 means answers between correct±0.5 are accepted.</p>
        </div>
    );
}

function CategorizationConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const categories: string[] = (question.metadata?.categories as string[]) || [];
    const items: Array<{ text: string; category: string }> = (question.metadata?.items as Array<{ text: string; category: string }>) || [];

    const updateMeta = (key: string, value: unknown) =>
        onChange({ ...question, metadata: { ...question.metadata, [key]: value } });

    const addCategory = () => updateMeta('categories', [...categories, '']);
    const updateCategory = (i: number, v: string) => updateMeta('categories', categories.map((c, idx) => idx === i ? v : c));
    const removeCategory = (i: number) => updateMeta('categories', categories.filter((_, idx) => idx !== i));

    const addItem = () => updateMeta('items', [...items, { text: '', category: categories[0] || '' }]);
    const updateItem = (i: number, field: 'text' | 'category', v: string) =>
        updateMeta('items', items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
    const removeItem = (i: number) => updateMeta('items', items.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium">Categories</p>
                {categories.map((cat, i) => (
                    <div key={i} className="flex gap-2">
                        <TextInput value={cat} onChange={v => updateCategory(i, v)} placeholder={`Category ${i + 1}`} />
                        <button type="button" onClick={() => removeCategory(i)} className="text-destructive shrink-0">✕</button>
                    </div>
                ))}
                <button type="button" onClick={addCategory} className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium">
                    + Add Category
                </button>
            </div>
            <div className="space-y-2">
                <p className="text-sm font-medium">Items to Categorize</p>
                {items.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <TextInput value={it.text} onChange={v => updateItem(i, 'text', v)} placeholder="Item text" />
                        <select
                            className="p-2 border border-border bg-background rounded-md text-sm shrink-0"
                            value={it.category}
                            onChange={e => updateItem(i, 'category', e.target.value)}
                        >
                            {categories.map(c => <option key={c} value={c}>{c || '(unnamed)'}</option>)}
                        </select>
                        <button type="button" onClick={() => removeItem(i)} className="text-destructive shrink-0">✕</button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium">
                    + Add Item
                </button>
            </div>
        </div>
    );
}

function MultipleDropdownConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const blanks: Array<{ id: string; options: string[]; correct: string }> =
        (question.metadata?.blanks as Array<{ id: string; options: string[]; correct: string }>) || [];

    const addBlank = () => {
        const id = `blank_${Date.now()}`;
        onChange({ ...question, metadata: { ...question.metadata, blanks: [...blanks, { id, options: [], correct: '' }] } });
    };
    const removeBlank = (i: number) =>
        onChange({ ...question, metadata: { ...question.metadata, blanks: blanks.filter((_, idx) => idx !== i) } });
    const updateBlank = (i: number, field: 'correct', v: string) => {
        const next = blanks.map((b, idx) => idx === i ? { ...b, [field]: v } : b);
        onChange({ ...question, metadata: { ...question.metadata, blanks: next } });
    };
    const updateOptions = (i: number, raw: string) => {
        const opts = raw.split(',').map(s => s.trim()).filter(Boolean);
        const next = blanks.map((b, idx) => idx === i ? { ...b, options: opts } : b);
        onChange({ ...question, metadata: { ...question.metadata, blanks: next } });
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
                Reference blanks in the question prompt using <code className="bg-muted px-1 rounded">{'{{blank_id}}'}</code>. Each blank below becomes a dropdown.
            </p>
            {blanks.map((b, i) => (
                <div key={b.id} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{`{{${b.id}}}`}</code>
                        <button type="button" onClick={() => removeBlank(i)} className="text-destructive text-xs">Remove</button>
                    </div>
                    <Field label="Options (comma separated)">
                        <TextInput
                            value={b.options.join(', ')}
                            onChange={v => updateOptions(i, v)}
                            placeholder="Option A, Option B, Option C"
                        />
                    </Field>
                    <Field label="Correct Option">
                        <TextInput
                            value={b.correct}
                            onChange={v => updateBlank(i, 'correct', v)}
                            placeholder="Option A"
                        />
                    </Field>
                </div>
            ))}
            <button type="button" onClick={addBlank} className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium">
                + Add Dropdown Blank
            </button>
        </div>
    );
}

function RandomizedPoolConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const poolSize = (question.metadata?.poolSize as number) || 3;
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                This question type pulls N random questions from the other questions in this quiz when a student takes it. Add all possible questions to the quiz normally, then set how many to show per attempt.
            </p>
            <Field label="Questions to show per attempt">
                <input
                    type="number"
                    min="1"
                    className="w-24 p-2 border border-border bg-background rounded-md text-sm"
                    value={poolSize}
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, poolSize: Number(e.target.value) } })}
                />
            </Field>
        </div>
    );
}


// ─── Multiple Choice with per-option feedback ─────────────────────────────────

function MultipleChoiceConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    type ChoiceOption = { text: string; isCorrect: boolean; feedback: string };

    // Hydrate from metadata.choiceOptions; fall back to migrating old options[] format
    const choices: ChoiceOption[] = (question.metadata?.choiceOptions as ChoiceOption[]) ||
        (question.options && question.options.length > 0
            ? question.options.map((opt: string) => ({
                text: opt,
                isCorrect: opt === (question.correctAnswer as string),
                feedback: '',
            }))
            : [
                { text: '', isCorrect: false, feedback: '' },
                { text: '', isCorrect: false, feedback: '' },
                { text: '', isCorrect: false, feedback: '' },
                { text: '', isCorrect: false, feedback: '' },
            ]);

    const syncAndUpdate = (next: ChoiceOption[]) => {
        const correct = next.find(c => c.isCorrect);
        onChange({
            ...question,
            options: next.map(c => c.text),
            correctAnswer: correct?.text || '',
            metadata: { ...question.metadata, choiceOptions: next },
        });
    };

    const updateChoice = (i: number, field: keyof ChoiceOption, value: string | boolean) => {
        const next = choices.map((c, idx) => ({ ...c })); // clone
        (next[i] as Record<string, unknown>)[field] = value;
        // Single correct answer — unmark others when marking one
        if (field === 'isCorrect' && value === true) {
            next.forEach((c, idx) => { if (idx !== i) c.isCorrect = false; });
        }
        syncAndUpdate(next);
    };

    const addChoice = () => syncAndUpdate([...choices, { text: '', isCorrect: false, feedback: '' }]);
    const removeChoice = (i: number) => syncAndUpdate(choices.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
                Click the letter button to mark the correct answer. Add optional feedback shown after the student answers.
            </p>
            {choices.map((choice, i) => (
                <div
                    key={i}
                    className={`border rounded-lg p-3 space-y-2 transition-colors ${
                        choice.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20'
                            : 'border-border bg-background'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {/* Correct toggle — letter turns to checkmark when selected */}
                        <button
                            type="button"
                            onClick={() => updateChoice(i, 'isCorrect', !choice.isCorrect)}
                            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                choice.isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-secondary border border-border'
                            }`}
                            title={choice.isCorrect ? 'Correct answer (click to unmark)' : 'Mark as correct answer'}
                        >
                            {choice.isCorrect ? '✓' : String.fromCharCode(65 + i)}
                        </button>
                        <TextInput
                            value={choice.text}
                            onChange={v => updateChoice(i, 'text', v)}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        />
                        <button
                            type="button"
                            onClick={() => removeChoice(i)}
                            className="text-destructive hover:text-destructive/80 shrink-0 px-1"
                            title="Remove option"
                        >
                            ✕
                        </button>
                    </div>
                    {/* Per-option feedback */}
                    <div className="pl-9">
                        <input
                            type="text"
                            className={`w-full p-1.5 border rounded-md text-xs ${
                                choice.isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 placeholder:text-emerald-400 focus:ring-emerald-300'
                                    : 'border-rose-200 bg-rose-50 placeholder:text-rose-400 focus:ring-rose-300'
                            } outline-none focus:ring-1`}
                            placeholder={
                                choice.isCorrect
                                    ? 'Correct! Add feedback text (optional)...'
                                    : 'Not quite. Add feedback text (optional)...'
                            }
                            value={choice.feedback}
                            onChange={e => updateChoice(i, 'feedback', e.target.value)}
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addChoice}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Option
            </button>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function QuizQuestionBuilder({ question, onChange, onDelete }: QuizQuestionBuilderProps) {

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({ ...question, type: e.target.value as QuestionType });
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...question, points: Number(e.target.value) });
    };

    const renderSpecificOptions = () => {
        switch (question.type) {
            case 'MULTIPLE_CHOICE':
                return <MultipleChoiceConfig question={question} onChange={onChange} />;
            case 'TRUE_FALSE':
                return (
                    <Field label="Correct Answer">
                        <select
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            value={question.correctAnswer as string || 'true'}
                            onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </Field>
                );
            case 'FILL_IN_BLANK':
                return <FillInBlank question={question} onChange={onChange} />;
            case 'MATCHING':
                return <MatchingConfig question={question} onChange={onChange} />;
            case 'ESSAY':
                return <EssayConfig question={question} onChange={onChange} />;
            case 'ORDERING':
                return <OrderingConfig question={question} onChange={onChange} />;
            case 'HOT_SPOT':
                return <HotSpotConfig question={question} onChange={onChange} />;
            case 'NUMERICAL':
                return <NumericalConfig question={question} onChange={onChange} />;
            case 'CATEGORIZATION':
                return <CategorizationConfig question={question} onChange={onChange} />;
            case 'MULTIPLE_DROPDOWN':
                return <MultipleDropdownConfig question={question} onChange={onChange} />;
            case 'RANDOMIZED_POOL':
                return <RandomizedPoolConfig question={question} onChange={onChange} />;
            case 'DESCRIPTION':
                return <p className="text-xs text-muted-foreground italic">This block displays informational text only — no student response or points.</p>;
            default:
                return null;
        }
    };

    const QUESTION_LABELS: Record<QuestionType, string> = {
        MULTIPLE_CHOICE: 'Multiple Choice',
        TRUE_FALSE: 'True / False',
        FILL_IN_BLANK: 'Fill in the Blank',
        MATCHING: 'Matching',
        ESSAY: 'Essay / Free Text',
        ORDERING: 'Ordering',
        HOT_SPOT: 'Hot Spot',
        NUMERICAL: 'Numerical',
        CATEGORIZATION: 'Categorization',
        MULTIPLE_DROPDOWN: 'Multiple Drop-down',
        RANDOMIZED_POOL: 'Randomized Pool',
        DESCRIPTION: 'Description Only (No points)',
    };

    return (
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <select
                    value={question.type}
                    onChange={handleTypeChange}
                    className="p-2 border border-border bg-background rounded-md text-sm font-medium"
                >
                    {(Object.entries(QUESTION_LABELS) as [QuestionType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    {question.type !== 'DESCRIPTION' && question.type !== 'ESSAY' && question.type !== 'RANDOMIZED_POOL' && (
                        <div className="flex items-center gap-1">
                            <label className="text-sm">Points:</label>
                            <input
                                type="number"
                                min="0"
                                value={question.points}
                                onChange={handlePointsChange}
                                className="w-16 p-1 border border-border bg-background text-sm rounded-md"
                            />
                        </div>
                    )}
                    <button onClick={onDelete} className="text-destructive hover:text-destructive/80 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </button>
                </div>
            </div>

            {question.type !== 'DESCRIPTION' && (
                <div>
                    <label className="text-sm font-medium block mb-1">Question Prompt</label>
                    <RichTextEditor
                        content={question.questionText}
                        onChange={(html) => onChange({ ...question, questionText: html })}
                    />
                </div>
            )}

            {question.type === 'DESCRIPTION' && (
                <div>
                    <label className="text-sm font-medium block mb-1">Content</label>
                    <RichTextEditor
                        content={question.questionText}
                        onChange={(html) => onChange({ ...question, questionText: html })}
                    />
                </div>
            )}

            <div className="pt-2 border-t border-border">
                {renderSpecificOptions()}
            </div>
        </div>
    );
}
