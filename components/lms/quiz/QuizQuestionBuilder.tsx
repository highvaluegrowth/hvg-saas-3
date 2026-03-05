'use client';

import React from 'react';
import { QuizQuestion, QuestionType } from '@/types/lms/course';
import { RichTextEditor } from '../RichTextEditor';

interface QuizQuestionBuilderProps {
    question: QuizQuestion;
    onChange: (updated: QuizQuestion) => void;
    onDelete: () => void;
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

// ─── Main Component ────────────────────────────────────────────────────────────

const QUESTION_LABELS: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: 'Multiple Choice',
    TRUE_FALSE: 'True / False',
    SHORT_ANSWER: 'Short Answer',
    LONG_ANSWER: 'Long Answer (Essay)',
    FILL_BLANK: 'Fill in the Blank',
    LIKERT_SCALE: 'Likert Scale (1–5)',
};

// These types use manual grading / no points system
const NO_POINTS_TYPES: QuestionType[] = ['SHORT_ANSWER', 'LONG_ANSWER', 'LIKERT_SCALE'];

export function QuizQuestionBuilder({ question, onChange, onDelete }: QuizQuestionBuilderProps) {
    const renderConfig = () => {
        switch (question.type) {
            case 'MULTIPLE_CHOICE': return <MultipleChoiceConfig question={question} onChange={onChange} />;
            case 'TRUE_FALSE':      return <TrueFalseConfig question={question} onChange={onChange} />;
            case 'SHORT_ANSWER':    return <ShortAnswerConfig question={question} onChange={onChange} />;
            case 'LONG_ANSWER':     return <LongAnswerConfig question={question} onChange={onChange} />;
            case 'FILL_BLANK':      return <FillBlankConfig question={question} onChange={onChange} />;
            case 'LIKERT_SCALE':    return <LikertScaleConfig question={question} onChange={onChange} />;
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
