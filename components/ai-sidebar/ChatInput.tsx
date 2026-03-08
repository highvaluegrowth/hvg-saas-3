'use client';

import { useState, useRef, useEffect } from 'react';
import { SLASH_COMMAND_REGISTRY } from '@/lib/ai/commandParser';

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
    userRole?: string;
    isDirector?: boolean;
}

export function ChatInput({ onSend, isLoading, userRole, isDirector }: ChatInputProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isOperator = userRole && userRole !== 'resident';
    const filteredCommands = SLASH_COMMAND_REGISTRY.filter(
        (c) => c.roles.includes(isOperator ? 'operator' : 'resident')
    );

    // Derive slash command suggestions directly — no state needed
    const slashFilter = value.startsWith('/') && !value.includes(' ') ? value.slice(1).toLowerCase() : null;
    const suggestions = slashFilter !== null
        ? filteredCommands.filter(c => c.command.slice(1).startsWith(slashFilter))
        : [];
    const showMenu = suggestions.length > 0;

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
        // Escape: user can just clear value to dismiss
    }

    function submit() {
        const trimmed = value.trim();
        if (!trimmed || isLoading) return;
        onSend(trimmed);
        setValue('');
    }

    function selectCommand(cmd: string) {
        setValue(cmd + ' ');
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
        <div
            className="border-t p-3 relative"
            style={{ borderColor: isDirector ? 'rgba(217,70,239,0.15)' : 'rgba(8,145,178,0.15)', background: 'transparent' }}
        >
            {/* Slash command autocomplete */}
            {showMenu && (
                <div
                    className="absolute bottom-full left-3 right-3 mb-1 rounded-xl overflow-hidden shadow-2xl z-10"
                    style={{
                        background: isDirector ? 'rgba(15,7,26,0.98)' : 'rgba(6,14,26,0.98)',
                        border: isDirector ? '1px solid rgba(217,70,239,0.25)' : '1px solid rgba(8,145,178,0.25)',
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {suggestions.map((cmd) => (
                        <button
                            key={cmd.command}
                            type="button"
                            onClick={() => selectCommand(cmd.command)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDirector ? 'rgba(217,70,239,0.12)' : 'rgba(8,145,178,0.12)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            <span className="font-mono text-xs font-semibold w-24 shrink-0" style={{ color: isDirector ? '#E879F9' : '#67E8F9' }}>{cmd.command}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{cmd.description}</span>
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
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.88)',
                        minHeight: '40px',
                        maxHeight: '120px',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = isDirector ? 'rgba(217,70,239,0.5)' : 'rgba(8,145,178,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={isLoading || !value.trim()}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 hover:opacity-90"
                    style={{
                        background: value.trim()
                            ? (isDirector ? 'linear-gradient(135deg, #D946EF 0%, #A21CAF 100%)' : 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)')
                            : (isDirector ? 'rgba(217,70,239,0.2)' : 'rgba(8,145,178,0.2)'),
                    }}
                    aria-label="Send message"
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                </button>
            </div>
            <p className="text-xs mt-1.5 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Shift+Enter for new line · /help for commands
            </p>
        </div>
    );
}
