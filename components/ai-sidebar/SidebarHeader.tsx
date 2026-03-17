'use client';

import React from 'react';
import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';
import { Mic, MicOff, Trash2, X, Sparkles, Zap, Shield } from 'lucide-react';

interface SidebarHeaderProps {
    persona: 'recovery' | 'operator';
    onClose: () => void;
    onClear: () => void;
    isDirector?: boolean;
}

export function SidebarHeader({ persona, onClose, onClear, isDirector }: SidebarHeaderProps) {
    const { isVoiceMode, setVoiceMode } = useAISidebarStore();

    return (
        <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: isDirector ? 'rgba(217,70,239,0.15)' : 'rgba(8,145,178,0.15)' }}
        >
            {/* Agent identity */}
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                        background: isDirector
                            ? 'linear-gradient(135deg, rgba(217,70,239,0.3) 0%, rgba(139,92,246,0.15) 100%)'
                            : persona === 'operator'
                                ? 'linear-gradient(135deg, rgba(8,145,178,0.3) 0%, rgba(52,211,153,0.15) 100%)'
                                : 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.15) 100%)',
                        border: isDirector 
                            ? '1px solid rgba(217,70,239,0.3)' 
                            : persona === 'operator'
                                ? '1px solid rgba(8,145,178,0.3)'
                                : '1px solid rgba(99,102,241,0.3)',
                        color: isDirector ? '#E879F9' : persona === 'operator' ? '#67E8F9' : '#A5B4FC',
                    }}
                >
                    {isDirector ? <Shield size={16} /> : persona === 'operator' ? <Zap size={16} /> : <Sparkles size={16} />}
                </div>
                <div>
                    <p className="text-sm font-semibold leading-tight text-white">
                        HVG Outlet
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-tight opacity-50" style={{ color: isDirector ? '#E879F9' : persona === 'operator' ? '#67E8F9' : '#A5B4FC' }}>
                        {isDirector ? 'Director Tier' : persona === 'operator' ? 'Operator Tier' : 'Resident Tier'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Voice Toggle */}
                <button
                    type="button"
                    onClick={() => setVoiceMode(!isVoiceMode)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isVoiceMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-white/40 hover:bg-white/10 hover:text-white/80'
                    }`}
                    title={isVoiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                >
                    {isVoiceMode ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} />}
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                    type="button"
                    onClick={onClear}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors duration-150 cursor-pointer"
                    title="Clear conversation"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors duration-150 cursor-pointer"
                    title="Close sidebar"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
