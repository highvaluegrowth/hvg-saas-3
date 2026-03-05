'use client';

import { AppStoreBadges } from './AppStoreBadges';

const features = [
    {
        emoji: '🤖',
        title: 'AI Recovery Coach',
        description: 'Empathetic, evidence-based guidance powered by Google Gemini — available at 3am when no one else is.',
        color: '#0891B2',
    },
    {
        emoji: '🏆',
        title: 'Sobriety Tracker',
        description: 'Daily check-ins, streak badges, and milestone celebrations that make every day of recovery feel like a win.',
        color: '#059669',
    },
    {
        emoji: '🚨',
        title: 'Crisis Support',
        description: 'One tap to 988, sponsor contact, or a grounding exercise. Help is always one screen away.',
        color: '#EF4444',
    },
    {
        emoji: '📚',
        title: 'Recovery Program',
        description: 'Structured 12-step content, CBT exercises, and mindfulness modules — all on your phone.',
        color: '#8B5CF6',
    },
];

const conversation = [
    { role: 'user', text: "I've been sober 90 days. I'm really proud of myself." },
    { role: 'ai', text: "90 days — that is a huge milestone. You've built something real. What's felt most different for you?" },
    { role: 'user', text: "I actually sleep now. And I feel present with my kids." },
    { role: 'ai', text: "That's everything. Keep showing up like this. 🏆" },
];

export function AIRecoverySection() {
    return (
        <section
            id="ai-recovery"
            className="py-28 px-6 relative overflow-hidden"
            style={{ background: '#fff', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            {/* Ambient glow */}
            <div
                className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 70%)',
                    transform: 'translate(30%, -30%)',
                }}
            />
            <div
                className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)',
                    transform: 'translate(-30%, 30%)',
                }}
            />

            <div className="max-w-6xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Powered by Google Gemini 2.5
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: '#0C1A2E' }}>
                        A recovery coach in your pocket.<br />
                        <span style={{ color: '#0891B2' }}>24/7, no waiting room.</span>
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#4A6070', fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        No judgment. No appointment. Just compassionate, evidence-based support from an AI
                        built specifically to help people navigate early recovery.
                    </p>
                </div>

                {/* Main layout: chat mockup + feature list */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

                    {/* — Phone mockup (chat UI) — */}
                    <div className="flex justify-center">
                        <div
                            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                            style={{
                                background: '#0F172A',
                                border: '6px solid #1E293B',
                                boxShadow: '0 32px 80px rgba(8,145,178,0.18), 0 0 0 1px rgba(8,145,178,0.1)',
                            }}
                        >
                            {/* Status bar */}
                            <div className="flex justify-between items-center px-5 pt-4 pb-2">
                                <span className="text-xs text-white/40 font-medium">9:41 AM</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-xs text-emerald-400 font-semibold">HVG Guide</span>
                                </div>
                            </div>

                            {/* Chat header */}
                            <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(8,145,178,0.08)' }}>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                                    style={{ background: 'rgba(8,145,178,0.2)' }}>
                                    🤖
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">HVG Guide</div>
                                    <div className="text-xs text-emerald-400">● online — always</div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="px-4 py-5 space-y-4 min-h-[320px]">
                                {conversation.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className="rounded-2xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed"
                                            style={{
                                                background: msg.role === 'user' ? '#0891B2' : '#1E293B',
                                                color: 'white',
                                                fontFamily: 'var(--font-noto), sans-serif',
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {/* Typing indicator */}
                                <div className="flex justify-start">
                                    <div className="flex gap-1.5 items-center px-4 py-3 rounded-2xl" style={{ background: '#1E293B' }}>
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Input bar */}
                            <div className="px-4 pb-6 pt-2">
                                <div className="flex gap-2 items-center rounded-2xl px-4 py-3" style={{ background: '#1E293B', border: '1px solid rgba(8,145,178,0.2)' }}>
                                    <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Ask anything…</span>
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#0891B2' }}>
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* — Feature list — */}
                    <div className="space-y-5">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="flex gap-4 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                                style={{
                                    background: '#F8FBFF',
                                    border: '1px solid rgba(8,145,178,0.1)',
                                    boxShadow: '0 2px 12px rgba(8,145,178,0.05)',
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                    style={{ background: `${f.color}12` }}
                                >
                                    {f.emoji}
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1" style={{ color: '#0C1A2E' }}>{f.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: '#4A6070', fontFamily: 'var(--font-noto), sans-serif' }}>
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Download CTA */}
                <div
                    className="rounded-3xl p-10 text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #0C4A6E 0%, #164E63 50%, #065F46 100%)',
                        boxShadow: '0 24px 64px rgba(8,145,178,0.2)',
                    }}
                >
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10"
                        style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none opacity-10"
                        style={{ background: 'radial-gradient(circle, #34D399, transparent)', transform: 'translate(-20%, 20%)' }} />

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                            FREE TO DOWNLOAD
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Start your recovery journey today.
                        </h3>
                        <p className="text-white/70 mb-8 max-w-md mx-auto text-sm"
                            style={{ fontFamily: 'var(--font-noto), sans-serif' }}>
                            No subscription required to get started. Download the app and begin your first AI session free.
                        </p>
                        <div id="residents" className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <AppStoreBadges />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
