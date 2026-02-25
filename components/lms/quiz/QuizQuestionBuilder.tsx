'use client';

import React, { useState } from 'react';
import { QuizQuestion, QuestionType } from '@/types/lms/course';
import { RichTextEditor } from '../RichTextEditor';

interface QuizQuestionBuilderProps {
    question: QuizQuestion;
    onChange: (updated: QuizQuestion) => void;
    onDelete: () => void;
}

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
                return (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Options (comma separated for MVP)</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            placeholder="A, B, C, D"
                            value={question.options?.join(', ') || ''}
                            onChange={(e) => onChange({ ...question, options: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <label className="text-sm font-medium">Correct Answer</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            placeholder="A"
                            value={question.correctAnswer as string || ''}
                            onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                        />
                    </div>
                );
            case 'TRUE_FALSE':
                return (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Correct Answer</label>
                        <select
                            className="w-full p-2 border border-border bg-background rounded-md text-sm"
                            value={question.correctAnswer as string || 'true'}
                            onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </div>
                );
            // TODO: Implement the other 10 types as requested
            default:
                return <p className="text-xs text-muted-foreground italic">Configuration for {question.type} coming soon.</p>;
        }
    };

    return (
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <select
                    value={question.type}
                    onChange={handleTypeChange}
                    className="p-2 border border-border bg-background rounded-md text-sm font-medium"
                >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="FILL_IN_BLANK">Fill in the Blank</option>
                    <option value="MATCHING">Matching</option>
                    <option value="ESSAY">Essay / Free Text</option>
                    <option value="ORDERING">Ordering</option>
                    <option value="HOT_SPOT">Hot Spot</option>
                    <option value="NUMERICAL">Numerical</option>
                    <option value="CATEGORIZATION">Categorization</option>
                    <option value="MULTIPLE_DROPDOWN">Multiple Drop-down</option>
                    <option value="RANDOMIZED_POOL">Randomized Pool</option>
                    <option value="DESCRIPTION">Description Only (No points)</option>
                </select>

                <div className="flex items-center gap-2">
                    {question.type !== 'DESCRIPTION' && (
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </button>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium block mb-1">Question Prompt</label>
                <RichTextEditor
                    content={question.questionText}
                    onChange={(html) => onChange({ ...question, questionText: html })}
                />
            </div>

            <div className="pt-2 border-t border-border">
                {renderSpecificOptions()}
            </div>
        </div>
    );
}
