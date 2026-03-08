'use client';

import React, { useState } from 'react';
import { useQaStore } from '@/lib/stores/qaStore';
import { qaService } from '@/features/qa/services/qaService';
import { FeedbackType } from '@/features/qa/types/qa.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useParams } from 'next/navigation';
import { X } from 'lucide-react';

export function FeedbackForm() {
    const { user } = useAuth();
    const params = useParams();
    const tenantId = params.tenantId as string | undefined;

    const {
        selectedBox,
        targetElementData,
        isFormOpen,
        resetSelection,
        setFeedbackModeActive,
        screenshotDataUrl
    } = useQaStore();

    const [type, setType] = useState<FeedbackType>('Bug');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isFormOpen || !selectedBox || !targetElementData) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            setError('Description is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await qaService.submitFeedback({
                tenantId: tenantId || 'system',
                reporterId: user?.uid || 'anonymous',
                route: targetElementData.route,
                targetElement: targetElementData,
                boundingBox: selectedBox,
                type,
                description,
                screenshotDataUrl: screenshotDataUrl || undefined,
                viewportSize: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                }
            });

            resetSelection();
            setFeedbackModeActive(false);
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const alignRight = selectedBox.x > window.innerWidth / 2;
    const alignBottom = selectedBox.y > window.innerHeight / 2;

    const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9991, // Above overlay but beneath some extreme modals if needed
    };

    if (alignRight) {
        style.right = window.innerWidth - selectedBox.x + 16;
    } else {
        style.left = selectedBox.x + selectedBox.w + 16;
    }

    if (alignBottom) {
        style.bottom = window.innerHeight - selectedBox.y - selectedBox.h;
    } else {
        style.top = selectedBox.y;
    }

    // Bound within screen
    style.maxHeight = '90vh';

    return (
        <>
            <div
                className="fixed border-2 border-cyan-600 bg-cyan-600/10 pointer-events-none z-9999"
                style={{
                    left: selectedBox.x,
                    top: selectedBox.y,
                    width: selectedBox.w,
                    height: selectedBox.h
                }}
            />
            <div
                style={style}
                className="w-[340px] bg-[#0C1A2E] border border-white/10 rounded-xl shadow-2xl overflow-y-auto backdrop-blur-xl flex flex-col"
            >
                <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0C1A2E]/95 backdrop-blur z-10">
                    <h3 className="text-white font-medium">Submit QA Feedback</h3>
                    <button onClick={resetSelection} className="text-white/50 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">Feedback Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as FeedbackType)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-600"
                        >
                            <option value="Bug">Bug reported</option>
                            <option value="UI Issue">UI Issue</option>
                            <option value="Suggestion">Suggestion</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">DOM Context</label>
                        <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs text-white/70 font-mono overflow-auto max-h-40 space-y-1">
                            <div className="break-all"><span className="text-cyan-600">Route:</span> {targetElementData.route}</div>
                            <div><span className="text-cyan-600">Tag:</span> {targetElementData.tag}</div>
                            {targetElementData.id && <div><span className="text-cyan-600">ID:</span> {targetElementData.id}</div>}
                            {targetElementData.dataComponent && <div><span className="text-cyan-600">Component:</span> {targetElementData.dataComponent}</div>}
                            {targetElementData.classes && <div className="break-all mt-1 pt-1 border-t border-white/5"><span className="text-cyan-600">Classes:</span> {targetElementData.classes}</div>}
                        </div>
                    </div>

                    {screenshotDataUrl && (
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">Capture</label>
                            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={screenshotDataUrl} alt="QA Capture" className="max-h-32 object-contain rounded" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            placeholder="What did you observe? What did you expect?"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-600 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 pb-1">
                        <button
                            type="button"
                            onClick={resetSelection}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg text-sm bg-cyan-600 hover:bg-cyan-600/80 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sumitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
