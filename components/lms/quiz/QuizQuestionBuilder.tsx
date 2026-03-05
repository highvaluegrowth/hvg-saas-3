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
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground italic">
                Students type a short response. Responses are reviewed manually — no auto-grading.
            </p>
            <Field label="Grading Notes (visible to instructors only)">
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

// ─── Main Component ────────────────────────────────────────────────────────────

const QUESTION_LABELS: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: 'Multiple Choice',
    TRUE_FALSE: 'True / False',
    SHORT_ANSWER: 'Short Answer',
};

export function QuizQuestionBuilder({ question, onChange, onDelete }: QuizQuestionBuilderProps) {
    const renderConfig = () => {
        switch (question.type) {
            case 'MULTIPLE_CHOICE': return <MultipleChoiceConfig question={question} onChange={onChange} />;
            case 'TRUE_FALSE':      return <TrueFalseConfig question={question} onChange={onChange} />;
            case 'SHORT_ANSWER':    return <ShortAnswerConfig question={question} onChange={onChange} />;
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
                    {question.type !== 'SHORT_ANSWER' && (
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
                    <button onClick={onDelete} className="text-destructive hover:text-destructive/80 p-1">
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
