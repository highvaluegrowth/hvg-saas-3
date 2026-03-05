'use client';

import { useState } from 'react';

const perks = [
    { icon: '🎯', text: '30-minute live walkthrough' },
    { icon: '💬', text: 'Live Q&A with our team' },
    { icon: '📊', text: 'See your data in the platform' },
    { icon: '🚫', text: 'No commitment, ever' },
];

export function DemoCTASection() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', company: '', beds: '', message: '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800));
        setSubmitted(true);
        setLoading(false);
    }

    return (
        <section
            id="demo"
            className="py-28 px-6 relative overflow-hidden"
            style={{
                background: 'linear-gradient(160deg, #0C1A2E 0%, #0C4A6E 50%, #064E3B 100%)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(8,145,178,0.4), transparent)' }} />
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(8,145,178,0.04) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            <div className="absolute top-16 right-12 w-72 h-72 rounded-full pointer-events-none opacity-10"
                style={{ background: 'radial-gradient(circle, #0891B2, transparent)' }} />
            <div className="absolute bottom-16 left-12 w-56 h-56 rounded-full pointer-events-none opacity-10"
                style={{ background: 'radial-gradient(circle, #059669, transparent)' }} />

            <div className="max-w-6xl mx-auto relative">

                {/* Top badge */}
                <div className="text-center mb-4">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        For sober living operators
                    </div>
                </div>

                {/* Headline */}
                <div className="text-center mb-14">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
                        See HVG in action.<br />
                        <span style={{ color: '#34D399' }}>Book your free demo.</span>
                    </h2>
                    <p
                        className="text-lg max-w-xl mx-auto text-white/70 leading-relaxed"
                        style={{ fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        30 minutes. No sales pressure. We&apos;ll walk you through property setup, resident
                        onboarding, LMS, and AI recovery tools — live.
                    </p>
                </div>

                {/* Main grid: perks + form */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                    {/* Left: perks + pricing (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            {perks.map((p) => (
                                <div
                                    key={p.text}
                                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <span className="text-2xl">{p.icon}</span>
                                    <span className="text-sm font-medium text-white/90">{p.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pricing callout */}
                        <div
                            className="rounded-2xl p-6"
                            style={{
                                background: 'rgba(52,211,153,0.08)',
                                border: '1px solid rgba(52,211,153,0.2)',
                            }}
                        >
                            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Simple pricing</div>
                            <div className="text-3xl font-bold text-white mb-1">
                                From <span style={{ color: '#34D399' }}>$99</span>
                                <span className="text-base font-normal text-white/50">/mo</span>
                            </div>
                            <div className="text-sm text-white/60 mb-3" style={{ fontFamily: 'var(--font-noto), sans-serif' }}>
                                Per property. Includes LMS, AI, and all ops tools.
                            </div>
                            <a
                                href="/pricing"
                                className="text-sm font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                                style={{ color: '#34D399' }}
                            >
                                View full pricing →
                            </a>
                        </div>
                    </div>

                    {/* Right: form (3 cols) */}
                    <div
                        className="lg:col-span-3 rounded-3xl p-8"
                        style={{
                            background: 'rgba(255,255,255,0.97)',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        {submitted ? (
                            <div className="text-center py-10">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl"
                                    style={{ background: 'rgba(5,150,105,0.1)' }}
                                >
                                    🎉
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ color: '#0C1A2E' }}>You&apos;re on the list!</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#64748B', fontFamily: 'var(--font-noto), sans-serif' }}>
                                    We&apos;ll reach out within 1 business day to schedule your<br />personalized demo. Check your inbox.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold" style={{ color: '#0C1A2E' }}>Request a Demo</h3>
                                    <p className="text-sm mt-1" style={{ color: '#64748B', fontFamily: 'var(--font-noto), sans-serif' }}>
                                        We respond within 1 business day.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', full: false },
                                        { id: 'email', label: 'Work Email', type: 'email', placeholder: 'jane@yourhouse.com', full: false },
                                        { id: 'company', label: 'Organization Name', type: 'text', placeholder: 'Sunrise Sober Living', full: false },
                                        { id: 'beds', label: 'Number of Beds', type: 'text', placeholder: '12', full: false },
                                    ].map((field) => (
                                        <div key={field.id}>
                                            <label htmlFor={field.id} className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#64748B' }}>
                                                {field.label}
                                            </label>
                                            <input
                                                id={field.id}
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                required={field.id !== 'beds'}
                                                value={form[field.id as keyof typeof form]}
                                                onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                                                style={{
                                                    background: '#F8FAFC',
                                                    border: '1px solid #E2E8F0',
                                                    color: '#0C1A2E',
                                                    fontFamily: 'var(--font-noto), sans-serif',
                                                }}
                                                onFocus={(e) => { e.target.style.borderColor = '#0891B2'; e.target.style.background = '#fff'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#64748B' }}>
                                        Biggest challenge today? (optional)
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={3}
                                        placeholder="Tell us what's keeping you up at night as an operator..."
                                        value={form.message}
                                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all duration-200"
                                        style={{
                                            background: '#F8FAFC',
                                            border: '1px solid #E2E8F0',
                                            color: '#0C1A2E',
                                            fontFamily: 'var(--font-noto), sans-serif',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#0891B2'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all duration-200 cursor-pointer hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: loading ? '#059669' : 'linear-gradient(135deg, #0891B2, #059669)',
                                        boxShadow: '0 8px 24px rgba(8,145,178,0.3)',
                                    }}
                                >
                                    {loading ? 'Sending…' : 'Book My Free Demo →'}
                                </button>

                                <p className="text-xs text-center" style={{ color: '#94A3B8', fontFamily: 'var(--font-noto), sans-serif' }}>
                                    No spam. No sales calls unless you want one. We respect your privacy.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
