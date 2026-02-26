'use client';

import { AppStoreBadges } from './AppStoreBadges';

const aiBentoItems = [
    {
        id: 'guide',
        colSpan: 'md:col-span-2',
        title: 'AI Recovery Coach',
        description: 'Powered by Google Gemini. Ask anything about your recovery journey — cravings, triggers, coping strategies — and get empathetic, evidence-based guidance 24/7.',
        preview: (
            <div className="mt-4 space-y-2">
                {[
                    { role: 'user', text: "I'm struggling with cravings tonight" },
                    { role: 'ai', text: "I hear you. Let's work through this together. Can you tell me what triggered the craving? We can build a coping plan from there." },
                ].map((msg) => (
                    <div key={msg.text} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-xs`}
                            style={{
                                background: msg.role === 'user' ? '#0891B2' : 'white',
                                color: msg.role === 'user' ? 'white' : '#164E63',
                                border: msg.role === 'ai' ? '1px solid rgba(8,145,178,0.15)' : 'none',
                                fontFamily: 'var(--font-noto), sans-serif',
                            }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div className="flex justify-start">
                    <div className="flex gap-1 items-center px-4 py-2.5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(8,145,178,0.15)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0891B2', animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0891B2', animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0891B2', animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 'streak',
        colSpan: 'md:col-span-1',
        title: 'Sobriety Streak',
        description: 'Daily check-ins, milestone badges, and streak tracking to celebrate every day of recovery.',
        preview: (
            <div className="mt-4 text-center">
                <div className="text-5xl font-bold mb-1" style={{ color: '#059669' }}>47</div>
                <div className="text-sm mb-3" style={{ color: '#164E63', opacity: 0.6 }}>days sober</div>
                <div className="flex justify-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium"
                            style={{ background: i < 5 ? '#059669' : 'rgba(5,150,105,0.15)', color: i < 5 ? 'white' : '#059669' }}>
                            {i < 5 ? '✓' : ''}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 'program',
        colSpan: 'md:col-span-1',
        title: 'Recovery Program',
        description: 'Structured 12-step content, CBT exercises, and mindfulness modules built into the app.',
        isMini: true,
    },
    {
        id: 'emergency',
        colSpan: 'md:col-span-1',
        title: 'Crisis Support',
        description: 'One-tap access to crisis lines, sponsor contact, and breathing exercises when things get hard.',
        isMini: true,
    },
];

export function AIRecoverySection() {
    return (
        <section
            id="ai-recovery"
            className="py-24 px-6"
            style={{ background: '#fff', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                        <span>Powered by Google Gemini</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#164E63' }}>
                        AI recovery support,<br />available 24/7 in your pocket.
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                        No waiting rooms. No judgment. Just compassionate, evidence-based support from an AI trained to help people navigate early recovery.
                    </p>
                </div>

                {/* AI Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                    {aiBentoItems.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-2xl p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${item.colSpan ?? ''}`}
                            style={{
                                background: '#ECFEFF',
                                boxShadow: '0 4px 20px rgba(8,145,178,0.08)',
                                border: '1px solid rgba(8,145,178,0.1)',
                            }}
                        >
                            <h3 className="text-lg font-semibold mb-2" style={{ color: '#164E63' }}>{item.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                                {item.description}
                            </p>
                            {item.preview && item.preview}
                        </div>
                    ))}
                </div>

                {/* Solo Recovery CTA */}
                <div className="rounded-2xl p-8 text-center"
                    style={{ background: 'linear-gradient(135deg, #ECFEFF, #f0fdfa)', border: '1px solid rgba(8,145,178,0.15)' }}>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: '#164E63' }}>Start your recovery journey today.</h3>
                    <p className="mb-6 text-sm" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                        No subscription required to get started. Download the app and begin your first AI session free.
                    </p>
                    <div id="residents" className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <AppStoreBadges />
                    </div>
                </div>
            </div>
        </section>
    );
}
