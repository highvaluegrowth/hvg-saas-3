'use client';

import React from 'react';
import { useQaStore } from '@/lib/stores/qaStore';
import { Bug } from 'lucide-react';

export function FeedbackToggle() {
    const { isFeedbackModeActive, toggleFeedbackMode } = useQaStore();

    return (
        <button
            onClick={toggleFeedbackMode}
            title="Toggle QA Feedback Mode (Shift+F)"
            className={`fixed bottom-6 right-6 z-9995 p-3 rounded-full shadow-2xl backdrop-blur-md transition-all border ${isFeedbackModeActive
                ? 'bg-cyan-600 border-cyan-600/50 text-white scale-110 shadow-[0_0_20px_rgba(8,145,178,0.4)]'
                : 'bg-[#0C1A2E]/80 border-white/10 text-white/60 hover:text-white hover:bg-[#0C1A2E] hover:border-white/20'
                }`}
        >
            <Bug size={24} />
            {/* Tooltip hint on hover in a real app, title solves it for now */}
        </button>
    );
}
