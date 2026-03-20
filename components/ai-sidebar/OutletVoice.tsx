'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';
import { Mic, X, Volume2, Activity } from 'lucide-react';

interface OutletVoiceProps {
    onSpeechProcessed: (text: string) => void;
    isDirector?: boolean;
    onClose?: () => void;
}

export function OutletVoice({ onSpeechProcessed, isDirector, onClose }: OutletVoiceProps) {
    const { setVoiceMode } = useAISidebarStore();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            
            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const final = event.results[i][0].transcript;
                        setTranscript(final);
                        // Process speech after a short delay to allow for natural pauses
                        setTimeout(() => {
                            if (final.trim()) {
                                onSpeechProcessed(final);
                                setTranscript('');
                            }
                        }, 1000);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(interimTranscript);
            };

            recognitionRef.current = recognition;
            recognition.start();
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onSpeechProcessed]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-[#060e1a]/95 backdrop-blur-3xl animate-in fade-in duration-500">
            {/* Close */}
            <button
                onClick={() => onClose ? onClose() : setVoiceMode(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/80 transition-all"
            >
                <X size={20} />
            </button>

            {/* Visualizer Ring */}
            <div className="relative mb-12">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${isDirector ? 'bg-fuchsia-500' : 'bg-cyan-500'} ${isListening ? 'animate-pulse' : ''}`} />
                <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center relative z-10 ${
                    isDirector ? 'border-fuchsia-500/30 bg-fuchsia-500/10' : 'border-cyan-500/30 bg-cyan-500/10'
                }`}>
                    <Mic size={48} className={isListening ? 'text-white' : 'text-white/20'} />
                    {/* Pulsing rings */}
                    {isListening && (
                        <>
                            <div className={`absolute inset-0 rounded-full border animate-ping opacity-20 ${isDirector ? 'border-fuchsia-500' : 'border-cyan-500'}`} style={{ animationDuration: '3s' }} />
                            <div className={`absolute inset-0 rounded-full border animate-ping opacity-10 ${isDirector ? 'border-fuchsia-500' : 'border-cyan-500'}`} style={{ animationDuration: '2s' }} />
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4 max-w-sm">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">
                    HVG Outlet Voice
                </h3>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDirector ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
                    {isListening ? 'Listening for input...' : 'Initializing Stream...'}
                </p>
                
                <div className="min-h-[60px] py-4">
                    {transcript ? (
                        <p className="text-lg font-medium text-white/90 leading-tight italic">
                            "{transcript}"
                        </p>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 opacity-20">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-1 h-4 rounded-full ${isDirector ? 'bg-fuchsia-500' : 'bg-cyan-500'} animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Tips */}
            <div className="mt-auto pt-8 border-t border-white/5 w-full">
                <div className="flex items-center justify-center gap-2 text-white/30">
                    <Volume2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Natural Execution Mode</span>
                </div>
            </div>
        </div>
    );
}
