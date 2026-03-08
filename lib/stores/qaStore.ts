import { create } from 'zustand';
import { BoundingBox } from '@/features/qa/types/qa.types';

interface QaState {
    isFeedbackModeActive: boolean;
    selectedBox: BoundingBox | null;
    targetElementData: {
        route: string;
        tag: string;
        id: string;
        classes: string;
        dataComponent: string | null;
    } | null;
    isFormOpen: boolean;
    screenshotDataUrl?: string;

    setFeedbackModeActive: (active: boolean) => void;
    setSelectedBox: (box: BoundingBox | null) => void;
    setTargetElementData: (data: QaState['targetElementData']) => void;
    setFormOpen: (open: boolean) => void;
    setScreenshotDataUrl: (url: string | undefined) => void;
    resetSelection: () => void;
    toggleFeedbackMode: () => void;
}

export const useQaStore = create<QaState>((set) => ({
    isFeedbackModeActive: false,
    selectedBox: null,
    targetElementData: null,
    isFormOpen: false,
    screenshotDataUrl: undefined,

    setFeedbackModeActive: (active) => set({ isFeedbackModeActive: active }),
    setSelectedBox: (box) => set({ selectedBox: box }),
    setTargetElementData: (data) => set({ targetElementData: data }),
    setFormOpen: (open) => set({ isFormOpen: open }),
    setScreenshotDataUrl: (url) => set({ screenshotDataUrl: url }),

    resetSelection: () => set({
        selectedBox: null,
        targetElementData: null,
        isFormOpen: false,
        screenshotDataUrl: undefined
    }),

    toggleFeedbackMode: () => set((state) => ({
        isFeedbackModeActive: !state.isFeedbackModeActive,
        selectedBox: null,
        targetElementData: null,
        isFormOpen: false,
        screenshotDataUrl: undefined
    })),
}));
