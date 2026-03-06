'use client';

const beforeItems = [
    { emoji: '📋', text: 'Paper sign-in sheets & binder chaos' },
    { emoji: '📊', text: 'Five different tools, none connected' },
    { emoji: '😰', text: 'Relapses go undetected for days' },
    { emoji: '💸', text: 'Rent leakage from manual tracking' },
    { emoji: '😔', text: 'Residents disengage, then disappear' },
];

const afterItems = [
    { emoji: '✅', text: 'Everything in one unified dashboard' },
    { emoji: '🔗', text: 'AI, LMS, ops, and mobile — connected' },
    { emoji: '🚨', text: 'Early-warning flags before crisis hits' },
    { emoji: '💰', text: 'Automated rent + fee tracking' },
    { emoji: '🏆', text: 'Gamified LMS keeps residents motivated' },
];

export function ProblemSection() {
    return (
        <section
            id="operators"
            className="py-28 px-6 relative overflow-hidden"
            style={{
                background: '#0C1A2E',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Dot grid texture */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(8,145,178,0.04) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />
            {/* Top separator line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(8,145,178,0.3), transparent)' }} />

            <div className="max-w-6xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-20">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        The Real Problem
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight text-white">
                        Sober living operators are<br />
                        <span style={{ color: '#67E8F9' }}>buried in busywork.</span>
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        You got into this work to change lives — not to spend your evenings chasing down
                        rent payments and updating spreadsheets. HVG fixes that.
                    </p>
                </div>

                {/* Before / After */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">

                    {/* — Before — */}
                    <div
                        className="rounded-3xl p-8 relative overflow-hidden"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            boxShadow: '0 4px 24px rgba(239,68,68,0.08)',
                        }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 uppercase tracking-widest"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                            Without HVG
                        </div>
                        <div className="space-y-4">
                            {beforeItems.map((item) => (
                                <div
                                    key={item.text}
                                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(239,68,68,0.12)',
                                    }}
                                >
                                    <span className="text-2xl shrink-0">{item.emoji}</span>
                                    <span
                                        className="text-sm font-medium line-through decoration-red-400/50"
                                        style={{ color: 'rgba(255,255,255,0.35)' }}
                                    >
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* — After — */}
                    <div
                        className="rounded-3xl p-8 relative overflow-hidden"
                        style={{
                            background: 'rgba(5,150,105,0.08)',
                            border: '1px solid rgba(52,211,153,0.2)',
                            boxShadow: '0 4px 24px rgba(5,150,105,0.1)',
                        }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 uppercase tracking-widest"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            With HVG
                        </div>
                        <div className="space-y-4">
                            {afterItems.map((item) => (
                                <div
                                    key={item.text}
                                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(52,211,153,0.12)',
                                    }}
                                >
                                    <span className="text-2xl shrink-0">{item.emoji}</span>
                                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom pull quote */}
                <div className="mt-16 text-center">
                    <blockquote
                        className="inline-block max-w-2xl rounded-2xl px-8 py-6 italic text-lg font-medium"
                        style={{
                            background: 'rgba(8,145,178,0.08)',
                            border: '1px solid rgba(8,145,178,0.2)',
                            color: 'rgba(255,255,255,0.75)',
                            fontFamily: 'var(--font-noto), sans-serif',
                        }}
                    >
                        &ldquo;HVG cut my admin time in half. I spend that time with residents now, not paperwork.&rdquo;
                        <footer className="mt-3 text-sm not-italic font-semibold" style={{ color: '#34D399' }}>
                            — Marcus T., House Manager · Phoenix, AZ
                        </footer>
                    </blockquote>
                </div>
            </div>
        </section>
    );
}
