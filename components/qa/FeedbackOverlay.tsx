'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQaStore } from '@/lib/stores/qaStore';
import { BoundingBox } from '@/features/qa/types/qa.types';
import html2canvas from 'html2canvas';

export function FeedbackOverlay() {
    const {
        isFeedbackModeActive,
        setFeedbackModeActive,
        setSelectedBox,
        setTargetElementData,
        setFormOpen,
        setScreenshotDataUrl,
        isFormOpen
    } = useQaStore();

    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift + F
            if (e.shiftKey && e.key.toLowerCase() === 'f') {
                setFeedbackModeActive(!isFeedbackModeActive);
            }
            if (e.key === 'Escape' && isFeedbackModeActive) {
                setFeedbackModeActive(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFeedbackModeActive, setFeedbackModeActive]);

    // Don't intercept clicks if the form is already open to allow the user to type in it
    if (!isFeedbackModeActive || isFormOpen) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        setStartPoint({ x, y });
        setCurrentBox({ x, y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!startPoint) return;
        e.preventDefault();
        e.stopPropagation();

        const x = Math.min(e.clientX, startPoint.x);
        const y = Math.min(e.clientY, startPoint.y);
        const w = Math.abs(e.clientX - startPoint.x);
        const h = Math.abs(e.clientY - startPoint.y);

        setCurrentBox({ x, y, w, h });
    };

    const handleMouseUp = async (e: React.MouseEvent) => {
        if (!startPoint || !currentBox) return;
        e.preventDefault();
        e.stopPropagation();

        setStartPoint(null);
        setIsCapturing(true);

        let finalBox = currentBox;
        if (finalBox.w < 10 && finalBox.h < 10) {
            finalBox = {
                x: e.clientX - 20,
                y: e.clientY - 20,
                w: 40,
                h: 40
            };
            setCurrentBox(finalBox);
        }

        if (overlayRef.current) {
            overlayRef.current.style.pointerEvents = 'none';
            overlayRef.current.style.display = 'none';
        }

        await new Promise(resolve => setTimeout(resolve, 10));

        const centerX = finalBox.x + finalBox.w / 2;
        const centerY = finalBox.y + finalBox.h / 2;

        const targetElement = document.elementFromPoint(centerX, centerY);

        let targetData = {
            route: window.location.pathname + window.location.search,
            tag: 'UNKNOWN',
            id: '',
            classes: '',
            dataComponent: null as string | null
        };

        if (targetElement) {
            const el = targetElement as HTMLElement;
            targetData = {
                route: window.location.pathname + window.location.search,
                tag: el.tagName.toLowerCase(),
                id: el.id,
                classes: Array.from(el.classList).join(' '),
                dataComponent: el.getAttribute('data-component')
            };
        }

        try {
            const canvas = await html2canvas(document.body, {
                logging: false,
                useCORS: true,
                x: finalBox.x + window.scrollX,
                y: finalBox.y + window.scrollY,
                width: finalBox.w,
                height: finalBox.h,
                backgroundColor: null
            });
            const dataUrl = canvas.toDataURL('image/png');
            setScreenshotDataUrl(dataUrl);
        } catch (err) {
            console.error('Screenshot failed', err);
        }

        if (overlayRef.current) {
            overlayRef.current.style.pointerEvents = 'auto';
            overlayRef.current.style.display = 'block';
        }

        setSelectedBox(finalBox);
        setTargetElementData(targetData);
        setFormOpen(true);
        setIsCapturing(false);
    };

    return (
        <div
            ref={overlayRef}
            className={`fixed inset-0 z-[9990] cursor-crosshair ${isCapturing ? 'bg-black/10' : 'bg-transparent'}`}
            style={{ userSelect: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0C1A2E]/90 border border-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-2xl">
                {isCapturing ? 'Capturing...' : 'QA Mode: Click and drag to select an element. Esc to cancel.'}
            </div>

            {currentBox && (
                <div
                    className="fixed border-2 border-cyan-600 bg-cyan-600/20 pointer-events-none"
                    style={{
                        left: currentBox.x,
                        top: currentBox.y,
                        width: currentBox.w,
                        height: currentBox.h
                    }}
                />
            )}
        </div>
    );
}
