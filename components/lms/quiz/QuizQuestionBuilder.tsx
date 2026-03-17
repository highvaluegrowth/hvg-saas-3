'use client';

import React from 'react';
import { QuizQuestion, QuestionType } from '@/types/lms/course';
import { RichTextEditor } from '../RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface QuizQuestionBuilderProps {
    question: QuizQuestion;
    onChange: (updated: QuizQuestion) => void;
    onDelete: () => void;
    /** Optional Firebase Storage base path for IMAGE_CHOICE uploads */
    storagePath?: string;
}

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

// ─── Multiple Choice ──────────────────────────────────────────────────────────

function MultipleChoiceConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    type ChoiceOption = { text: string; isCorrect: boolean; feedback: string };

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
        const next = choices.map(c => ({ ...c }));
        (next[i] as Record<string, unknown>)[field] = value;
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
                Click the letter button to mark the correct answer. Optionally add feedback shown after the student answers.
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
                        >
                            ✕
                        </button>
                    </div>
                    <div className="pl-9">
                        <input
                            type="text"
                            className={`w-full p-1.5 border rounded-md text-xs outline-none focus:ring-1 ${
                                choice.isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 placeholder:text-emerald-400 focus:ring-emerald-300'
                                    : 'border-rose-200 bg-rose-50 placeholder:text-rose-400 focus:ring-rose-300'
                            }`}
                            placeholder={choice.isCorrect ? 'Correct! Add feedback (optional)…' : 'Not quite. Add feedback (optional)…'}
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

// ─── True / False ─────────────────────────────────────────────────────────────

function TrueFalseConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    return (
        <Field label="Correct Answer">
            <select
                className="w-full p-2 border border-border bg-background rounded-md text-sm"
                value={question.correctAnswer as string || 'true'}
                onChange={e => onChange({ ...question, correctAnswer: e.target.value })}
            >
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
        </Field>
    );
}

// ─── Short Answer ─────────────────────────────────────────────────────────────

function ShortAnswerConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const gradingNotes = (question.metadata?.gradingNotes as string) || '';
    const maxLength = (question.metadata?.maxLength as number | '') ?? '';
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students type a short response (1–2 sentences). Reviewed manually — no auto-grading.
            </p>
            <Field label="Max characters (optional)">
                <input
                    type="number"
                    min={10}
                    max={1000}
                    className="w-32 p-2 border border-border bg-background rounded-md text-sm"
                    value={maxLength}
                    placeholder="e.g. 200"
                    onChange={e => onChange({
                        ...question,
                        metadata: { ...question.metadata, maxLength: e.target.value ? Number(e.target.value) : undefined },
                    })}
                />
            </Field>
            <Field label="Grading Notes (instructor-only)">
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

// ─── Long Answer (Essay) ──────────────────────────────────────────────────────

function LongAnswerConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const gradingNotes = (question.metadata?.gradingNotes as string) || '';
    const wordLimit = (question.metadata?.wordLimit as number | '') ?? '';
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students write a longer reflection or essay. Reviewed manually by instructors.
            </p>
            <Field label="Word limit (optional)">
                <input
                    type="number"
                    min={10}
                    max={5000}
                    className="w-32 p-2 border border-border bg-background rounded-md text-sm"
                    value={wordLimit}
                    placeholder="e.g. 300"
                    onChange={e => onChange({
                        ...question,
                        metadata: { ...question.metadata, wordLimit: e.target.value ? Number(e.target.value) : undefined },
                    })}
                />
            </Field>
            <Field label="Rubric / Grading Notes (instructor-only)">
                <textarea
                    rows={3}
                    className="w-full p-2 border border-border bg-background rounded-md text-sm resize-none"
                    value={gradingNotes}
                    placeholder="Describe what makes an excellent, average, and poor response…"
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, gradingNotes: e.target.value } })}
                />
            </Field>
        </div>
    );
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────

function FillBlankConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const answers: string[] = (question.metadata?.blankAnswers as string[]) || [''];
    const caseSensitive = (question.metadata?.caseSensitive as boolean) || false;

    const updateAnswers = (next: string[]) =>
        onChange({ ...question, correctAnswer: next[0] || '', metadata: { ...question.metadata, blankAnswers: next } });

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Use <code className="bg-muted px-1 rounded font-mono">___</code> in the question prompt above to mark blanks.
                List all acceptable answers below (student must match one exactly).
            </p>
            <Field label="Accepted Answers">
                <div className="space-y-2">
                    {answers.map((ans, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                            <input
                                type="text"
                                value={ans}
                                onChange={e => {
                                    const next = [...answers];
                                    next[i] = e.target.value;
                                    updateAnswers(next);
                                }}
                                placeholder={`Accepted answer ${i + 1}`}
                                className="flex-1 p-2 border border-border bg-background rounded-md text-sm"
                            />
                            {answers.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => updateAnswers(answers.filter((_, idx) => idx !== i))}
                                    className="text-destructive text-sm px-1 hover:text-destructive/70"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => updateAnswers([...answers, ''])}
                        className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
                    >
                        + Add alternative answer
                    </button>
                </div>
            </Field>
            <div className="flex items-center gap-2">
                <input
                    id={`case-${question.id}`}
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={e => onChange({ ...question, metadata: { ...question.metadata, caseSensitive: e.target.checked } })}
                    className="rounded border-border"
                />
                <label htmlFor={`case-${question.id}`} className="text-sm text-muted-foreground cursor-pointer">
                    Case-sensitive matching
                </label>
            </div>
        </div>
    );
}

// ─── Likert Scale ─────────────────────────────────────────────────────────────

const DEFAULT_LIKERT_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

function LikertScaleConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const labels: string[] = (question.metadata?.likertLabels as string[]) || DEFAULT_LIKERT_LABELS;

    const updateLabel = (i: number, val: string) => {
        const next = [...labels];
        next[i] = val;
        onChange({ ...question, metadata: { ...question.metadata, likertLabels: next } });
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students choose a value from 1 (left) to 5 (right). Responses are non-scored — used for attitude / opinion surveys.
            </p>
            {/* Preview bar */}
            <div className="flex items-end justify-between gap-1 bg-muted/30 border border-border rounded-lg px-4 py-3">
                {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            {n}
                        </div>
                        <span className="text-xs text-muted-foreground text-center leading-tight hidden sm:block" style={{ maxWidth: '60px', wordBreak: 'break-word' }}>
                            {labels[n - 1]}
                        </span>
                    </div>
                ))}
            </div>
            <Field label="Scale Labels (1 = leftmost, 5 = rightmost)">
                <div className="grid grid-cols-5 gap-2">
                    {labels.map((label, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-xs text-center text-muted-foreground font-semibold">{i + 1}</p>
                            <input
                                type="text"
                                value={label}
                                onChange={e => updateLabel(i, e.target.value)}
                                className="w-full p-1.5 border border-border bg-background rounded text-xs text-center"
                            />
                        </div>
                    ))}
                </div>
            </Field>
            <button
                type="button"
                onClick={() => onChange({ ...question, metadata: { ...question.metadata, likertLabels: DEFAULT_LIKERT_LABELS } })}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
                Reset to defaults
            </button>
        </div>
    );
}

// ─── Matching ─────────────────────────────────────────────────────────────────

function MatchingConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    type MatchPair = { term: string; definition: string };
    const pairs: MatchPair[] = (question.metadata?.pairs as MatchPair[]) || [
        { term: '', definition: '' },
        { term: '', definition: '' },
    ];

    const updatePairs = (next: MatchPair[]) =>
        onChange({ ...question, metadata: { ...question.metadata, pairs: next } });

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students match each term on the left to its definition on the right. Add at least 2 pairs.
            </p>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Term</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Definition / Match</span>
                </div>
                {pairs.map((pair, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 items-center">
                        <TextInput
                            value={pair.term}
                            onChange={v => {
                                const next = pairs.map(p => ({ ...p }));
                                next[i].term = v;
                                updatePairs(next);
                            }}
                            placeholder={`Term ${i + 1}`}
                        />
                        <div className="flex gap-2 items-center">
                            <TextInput
                                value={pair.definition}
                                onChange={v => {
                                    const next = pairs.map(p => ({ ...p }));
                                    next[i].definition = v;
                                    updatePairs(next);
                                }}
                                placeholder={`Definition ${i + 1}`}
                            />
                            {pairs.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => updatePairs(pairs.filter((_, idx) => idx !== i))}
                                    className="text-destructive shrink-0 px-1 hover:text-destructive/80 text-sm"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => updatePairs([...pairs, { term: '', definition: '' }])}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Pair
            </button>
            <p className="text-xs text-muted-foreground mt-1">
                💡 Definitions will be shuffled when students take the quiz.
            </p>
        </div>
    );
}

// ─── Ordering ─────────────────────────────────────────────────────────────────

function OrderingConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const items: string[] = (question.metadata?.orderedItems as string[]) || ['', ''];

    const updateItems = (next: string[]) =>
        onChange({ ...question, correctAnswer: next, metadata: { ...question.metadata, orderedItems: next } });

    const move = (i: number, dir: -1 | 1) => {
        const next = [...items];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        updateItems(next);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Enter items in the <strong>correct</strong> order. Students receive them shuffled and must rearrange them.
            </p>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {/* Up/down controls */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => move(i, -1)}
                                disabled={i === 0}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-25 text-xs leading-none px-1 py-0.5 rounded hover:bg-muted"
                            >▲</button>
                            <button
                                type="button"
                                onClick={() => move(i, 1)}
                                disabled={i === items.length - 1}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-25 text-xs leading-none px-1 py-0.5 rounded hover:bg-muted"
                            >▼</button>
                        </div>
                        <span className="text-xs text-muted-foreground w-5 text-right font-mono shrink-0">{i + 1}.</span>
                        <TextInput
                            value={item}
                            onChange={v => {
                                const next = [...items];
                                next[i] = v;
                                updateItems(next);
                            }}
                            placeholder={`Step / item ${i + 1}`}
                        />
                        {items.length > 2 && (
                            <button
                                type="button"
                                onClick={() => updateItems(items.filter((_, idx) => idx !== i))}
                                className="text-destructive px-1 hover:text-destructive/80 shrink-0 text-sm"
                            >✕</button>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => updateItems([...items, ''])}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Item
            </button>
        </div>
    );
}

// ─── Rating (Stars) ───────────────────────────────────────────────────────────

function RatingConfig({ question, onChange }: { question: QuizQuestion; onChange: (q: QuizQuestion) => void }) {
    const maxRating = (question.metadata?.maxRating as number) || 5;
    const minLabel = (question.metadata?.minLabel as string) || '';
    const maxLabel = (question.metadata?.maxLabel as string) || '';

    const update = (key: string, value: unknown) =>
        onChange({ ...question, metadata: { ...question.metadata, [key]: value } });

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students select a star rating. Responses are non-scored — used for satisfaction surveys and feedback collection.
            </p>
            {/* Star preview */}
            <div className="flex items-center gap-1 px-3 py-3 bg-muted/30 border border-border rounded-lg">
                {minLabel && <span className="text-xs text-muted-foreground mr-1">{minLabel}</span>}
                {Array.from({ length: maxRating }, (_, i) => (
                    <svg key={i} className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                {maxLabel && <span className="text-xs text-muted-foreground ml-1">{maxLabel}</span>}
            </div>
            <Field label="Maximum Stars">
                <select
                    className="p-2 border border-border bg-background rounded-md text-sm w-32"
                    value={maxRating}
                    onChange={e => update('maxRating', Number(e.target.value))}
                >
                    {[3, 4, 5, 6, 7, 10].map(n => (
                        <option key={n} value={n}>{n} stars</option>
                    ))}
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Low end label (optional)">
                    <TextInput value={minLabel} onChange={v => update('minLabel', v)} placeholder="e.g. Poor" />
                </Field>
                <Field label="High end label (optional)">
                    <TextInput value={maxLabel} onChange={v => update('maxLabel', v)} placeholder="e.g. Excellent" />
                </Field>
            </div>
        </div>
    );
}

// ─── Image Choice ─────────────────────────────────────────────────────────────

function ImageChoiceConfig({ question, onChange, storagePath }: {
    question: QuizQuestion;
    onChange: (q: QuizQuestion) => void;
    storagePath?: string;
}) {
    type ImageOption = { text: string; imageUrl: string; isCorrect: boolean };

    const choices: ImageOption[] = (question.metadata?.imageChoices as ImageOption[]) || [
        { text: '', imageUrl: '', isCorrect: false },
        { text: '', imageUrl: '', isCorrect: false },
    ];

    const updateChoices = (next: ImageOption[]) => {
        const correct = next.find(c => c.isCorrect);
        onChange({
            ...question,
            correctAnswer: correct?.text || '',
            metadata: { ...question.metadata, imageChoices: next },
        });
    };

    const updateChoice = (i: number, field: keyof ImageOption, value: string | boolean) => {
        const next = choices.map(c => ({ ...c }));
        (next[i] as Record<string, unknown>)[field] = value;
        if (field === 'isCorrect' && value === true) {
            next.forEach((c, idx) => { if (idx !== i) c.isCorrect = false; });
        }
        updateChoices(next);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students choose the correct image option. Mark one as the correct answer.
                {!storagePath && ' Paste image URLs directly, or pass a storagePath prop to enable file uploads.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
                {choices.map((choice, i) => (
                    <div
                        key={i}
                        className={`border rounded-lg p-3 space-y-2 transition-colors ${
                            choice.isCorrect
                                ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20'
                                : 'border-border bg-background'
                        }`}
                    >
                        {/* Image upload or URL input */}
                        {storagePath ? (
                            <ImageUpload
                                storagePath={`${storagePath}/img-choice-${question.id}-${i}`}
                                onUpload={(url: string) => updateChoice(i, 'imageUrl', url)}
                                currentUrl={choice.imageUrl || undefined}
                            />
                        ) : (
                            <div className="space-y-1">
                                {choice.imageUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={choice.imageUrl}
                                        alt={`Option ${String.fromCharCode(65 + i)}`}
                                        className="w-full h-28 object-cover rounded border border-border"
                                        onError={e => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                                <TextInput
                                    value={choice.imageUrl}
                                    onChange={v => updateChoice(i, 'imageUrl', v)}
                                    placeholder="Image URL…"
                                />
                            </div>
                        )}

                        {/* Caption + correct toggle */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => updateChoice(i, 'isCorrect', !choice.isCorrect)}
                                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    choice.isCorrect
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-muted border border-border text-muted-foreground hover:bg-secondary'
                                }`}
                                title={choice.isCorrect ? 'Correct (click to unmark)' : 'Mark as correct'}
                            >
                                {choice.isCorrect ? '✓' : String.fromCharCode(65 + i)}
                            </button>
                            <TextInput
                                value={choice.text}
                                onChange={v => updateChoice(i, 'text', v)}
                                placeholder="Caption (optional)"
                            />
                        </div>

                        {choices.length > 2 && (
                            <button
                                type="button"
                                onClick={() => updateChoices(choices.filter((_, idx) => idx !== i))}
                                className="text-xs text-destructive hover:text-destructive/80 w-full text-center py-0.5"
                            >
                                Remove option
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => updateChoices([...choices, { text: '', imageUrl: '', isCorrect: false }])}
                className="text-xs border border-border bg-muted hover:bg-secondary px-3 py-1.5 rounded font-medium"
            >
                + Add Option
            </button>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const QUESTION_LABELS: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: 'Multiple Choice',
    TRUE_FALSE:      'True / False',
    SHORT_ANSWER:    'Short Answer',
    LONG_ANSWER:     'Long Answer (Essay)',
    FILL_BLANK:      'Fill in the Blank',
    LIKERT_SCALE:    'Likert Scale (1–5)',
    MATCHING:        'Matching',
    ORDERING:        'Ordering / Sequence',
    RATING:          'Star Rating',
    IMAGE_CHOICE:    'Image Choice',
    FILE_UPLOAD:     'File Upload (Submission)',
    HOTSPOT:         'Image Hotspot',
};

// These types use manual grading / no points system
const NO_POINTS_TYPES: QuestionType[] = ['SHORT_ANSWER', 'LONG_ANSWER', 'LIKERT_SCALE', 'RATING', 'FILE_UPLOAD'];

export function QuizQuestionBuilder({ question, onChange, onDelete, storagePath }: QuizQuestionBuilderProps) {
    const renderConfig = () => {
        switch (question.type) {
            case 'MULTIPLE_CHOICE': return <MultipleChoiceConfig question={question} onChange={onChange} />;
            case 'TRUE_FALSE':      return <TrueFalseConfig question={question} onChange={onChange} />;
            case 'SHORT_ANSWER':    return <ShortAnswerConfig question={question} onChange={onChange} />;
            case 'LONG_ANSWER':     return <LongAnswerConfig question={question} onChange={onChange} />;
            case 'FILL_BLANK':      return <FillBlankConfig question={question} onChange={onChange} />;
            case 'LIKERT_SCALE':    return <LikertScaleConfig question={question} onChange={onChange} />;
            case 'MATCHING':        return <MatchingConfig question={question} onChange={onChange} />;
            case 'ORDERING':        return <OrderingConfig question={question} onChange={onChange} />;
            case 'RATING':          return <RatingConfig question={question} onChange={onChange} />;
            case 'IMAGE_CHOICE':    return <ImageChoiceConfig question={question} onChange={onChange} storagePath={storagePath} />;
            case 'FILE_UPLOAD':     return <div className="p-4 bg-muted/30 rounded-lg text-xs italic text-muted-foreground text-center border border-dashed">File upload configuration coming soon.</div>;
            case 'HOTSPOT':         return <div className="p-4 bg-muted/30 rounded-lg text-xs italic text-muted-foreground text-center border border-dashed">Image hotspot configuration coming soon.</div>;
        }
    };

    return (
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <select
                    value={question.type}
                    onChange={e => onChange({ ...question, type: e.target.value as QuestionType })}
                    className="p-2 border border-border bg-background rounded-md text-sm font-medium"
                >
                    {(Object.entries(QUESTION_LABELS) as [QuestionType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    {!NO_POINTS_TYPES.includes(question.type) && (
                        <div className="flex items-center gap-1">
                            <label className="text-sm">Points:</label>
                            <input
                                type="number"
                                min="0"
                                value={question.points}
                                onChange={e => onChange({ ...question, points: Number(e.target.value) })}
                                className="w-16 p-1 border border-border bg-background text-sm rounded-md"
                            />
                        </div>
                    )}
                    <button onClick={onDelete} className="text-destructive hover:text-destructive/80 p-1" title="Delete question">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </button>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium block mb-1">Question Prompt</label>
                <RichTextEditor
                    content={question.questionText}
                    onChange={html => onChange({ ...question, questionText: html })}
                />
            </div>

            <div className="pt-2 border-t border-border">
                {renderConfig()}
            </div>
        </div>
    );
}
