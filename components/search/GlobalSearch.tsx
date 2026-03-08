'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard shortcut (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => {
                    if (!prev) {
                        // Focus after state update
                        setTimeout(() => inputRef.current?.focus(), 10);
                        return true;
                    }
                    return false;
                });
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full max-w-md">
            {/* Search Input Trigger */}
            <div
                className="relative group cursor-text"
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 10);
                }}
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div
                    className="w-full pl-9 pr-12 py-2 text-sm rounded-lg flex items-center justify-between transition-all"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.4)',
                    }}
                >
                    <span>Search residents, properties, or requests...</span>
                    <div className="flex items-center space-x-1 opacity-60">
                        <Command className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">K</span>
                    </div>
                </div>
            </div>

            {/* Expanded Search State (Command Palette style) */}
            {isOpen && (
                <div className="absolute top-0 left-0 w-full z-50">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-cyan-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full pl-9 pr-12 py-2 text-sm rounded-lg focus:outline-none transition-all placeholder-white/30 text-white"
                        style={{
                            background: 'rgba(12, 26, 46, 0.95)',
                            border: '1px solid rgba(8, 145, 178, 0.3)',
                            boxShadow: '0 0 20px rgba(8, 145, 178, 0.15)',
                        }}
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onBlur={() => {
                            // Delay closing to allow clicking results
                            setTimeout(() => setIsOpen(false), 200);
                        }}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none opacity-60">
                        <span className="text-xs font-medium text-white/50">ESC</span>
                    </div>

                    {/* Results dropdown would go here */}
                    {query.trim().length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-lg backdrop-blur-md"
                            style={{
                                background: 'rgba(12, 26, 46, 0.95)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                                No results found
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
