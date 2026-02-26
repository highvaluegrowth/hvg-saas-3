'use client';

import { useState, useRef, useEffect } from 'react';
import { SLASH_COMMAND_REGISTRY } from '@/lib/ai/commandParser';

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
    userRole?: string;
}

export function ChatInput({ onSend, isLoading, userRole }: ChatInputProps) {
    const [value, setValue] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isOperator = userRole && userRole !== 'resident';
    const filteredCommands = SLASH_COMMAND_REGISTRY.filter(
        (c) => c.roles.includes(isOperator ? 'operator' : 'resident')
    );

    // Show slash command autocomplete when user types /
    const slashFilter = value.startsWith('/') && !value.includes(' ') ? value.slice(1).toLowerCase() : null;
    const suggestions = slashFilter !== null
        ? filteredCommands.filter(c => c.command.slice(1).startsWith(slashFilter))
        : [];

    useEffect(() => {
        setShowMenu(suggestions.length > 0);
    }, [suggestions.length]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
        if (e.key === 'Escape') setShowMenu(false);
    }

    function submit() {
        const trimmed = value.trim();
        if (!trimmed || isLoading) return;
        onSend(trimmed);
        setValue('');
        setShowMenu(false);
    }

    function selectCommand(cmd: string) {
        setValue(cmd + ' ');
        setShowMenu(false);
        textareaRef.current?.focus();
    }

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }, [value]);

    return (
        <div className="border-t p-3 relative" style={{ borderColor: 'rgba(113,131,85,0.15)', background: '#FDFBF7' }}>
            {/* Slash command autocomplete */}
            {showMenu && (
                <div
                    className="absolute bottom-full left-3 right-3 mb-1 rounded-xl overflow-hidden shadow-lg z-10"
                    style={{ background: 'white', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                    {suggestions.map((cmd) => (
                        <button
                            key={cmd.command}
                            type="button"
                            onClick={() => selectCommand(cmd.command)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer hover:bg-amber-50"
                        >
                            <span className="font-mono text-xs font-semibold w-24 shrink-0" style={{ color: '#F59E0B' }}>{cmd.command}</span>
                            <span className="text-xs" style={{ color: '#78716C' }}>{cmd.description}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything, or type / for commands…"
                    className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200"
                    style={{
                        background: 'white',
                        border: '1px solid rgba(113,131,85,0.2)',
                        color: '#1C1917',
                        minHeight: '40px',
                        maxHeight: '120px',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(113,131,85,0.2)')}
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={isLoading || !value.trim()}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-40 hover:opacity-90"
                    style={{ background: value.trim() ? '#F59E0B' : 'rgba(245,158,11,0.3)' }}
                    aria-label="Send message"
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                </button>
            </div>
            <p className="text-xs mt-1.5 px-1" style={{ color: '#78716C' }}>Shift+Enter for new line · /help for commands</p>
        </div>
    );
}
