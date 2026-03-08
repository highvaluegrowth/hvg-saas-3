'use client';

import React, { useEffect } from 'react';
import { useQaStore } from '@/lib/stores/qaStore';
import { FeedbackOverlay } from '@/components/qa/FeedbackOverlay';
import { FeedbackForm } from '@/components/qa/FeedbackForm';
import { FeedbackToggle } from '@/components/qa/FeedbackToggle';

export function QAProvider({ children }: { children: React.ReactNode }) {
    const { isFeedbackModeActive, setFeedbackModeActive, toggleFeedbackMode } = useQaStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input, textarea, or contenteditable element
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Shift + F
            if (e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFeedbackMode();
            }

            // Escape
            if (e.key === 'Escape' && isFeedbackModeActive) {
                e.preventDefault();
                setFeedbackModeActive(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFeedbackModeActive, setFeedbackModeActive, toggleFeedbackMode]);

    return (
        <>
            {children}
            {isFeedbackModeActive && <FeedbackOverlay />}
            <FeedbackForm />
            <FeedbackToggle />
        </>
    );
}
