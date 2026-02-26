'use client';

interface SidebarHeaderProps {
    persona: 'recovery' | 'operator';
    onClose: () => void;
    onClear: () => void;
}

const PERSONA_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    recovery: {
        label: 'Recovery Guide',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
        ),
    },
    operator: {
        label: 'Operations Assistant',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
    },
};

export function SidebarHeader({ persona, onClose, onClear }: SidebarHeaderProps) {
    const info = PERSONA_LABELS[persona] ?? PERSONA_LABELS.recovery;

    return (
        <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(113,131,85,0.15)' }}
        >
            {/* Agent identity */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                    {info.icon}
                </div>
                <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: '#1C1917' }}>HVG Assistant</p>
                    <p className="text-xs leading-tight" style={{ color: '#718355' }}>{info.label}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onClear}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer hover:bg-amber-50"
                    title="Clear conversation"
                    aria-label="Clear conversation"
                >
                    <svg className="w-3.5 h-3.5" style={{ color: '#78716C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer hover:bg-amber-50"
                    title="Close sidebar"
                    aria-label="Close AI sidebar"
                >
                    <svg className="w-3.5 h-3.5" style={{ color: '#78716C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
