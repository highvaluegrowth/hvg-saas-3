'use client';

import { useState } from 'react';

export function DemoCTASection() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        // Placeholder: replace with actual API call or Calendly redirect
        await new Promise((r) => setTimeout(r, 800));
        setSubmitted(true);
        setLoading(false);
    }

    return (
        <section
            id="demo"
            className="py-24 px-6"
            style={{ background: '#fff', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Value prop */}
                    <div>
                        <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                            style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                            For Operators
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: '#164E63' }}>
                            See HVG in action.<br />Book a live demo.
                        </h2>
                        <p className="text-lg mb-8 leading-relaxed" style={{ color: '#164E63', opacity: 0.7, fontFamily: 'var(--font-noto), sans-serif' }}>
                            We&apos;ll walk you through the full platform in 30 minutes — property setup, resident onboarding, LMS, and AI recovery tools.
                        </p>

                        <div className="space-y-4">
                            {[
                                { text: 'Free 30-minute walkthrough' },
                                { text: 'Live Q&A with our team' },
                                { text: 'See your house data in the platform' },
                                { text: 'No commitment required' },
                            ].map((item) => (
                                <div key={item.text} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(5,150,105,0.15)', color: '#059669' }}>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: '#164E63' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="rounded-2xl p-8"
                        style={{
                            background: '#ECFEFF',
                            boxShadow: '0 8px 32px rgba(8,145,178,0.1)',
                            border: '1px solid rgba(8,145,178,0.15)',
                        }}>
                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'rgba(5,150,105,0.15)' }}>
                                    <svg className="w-8 h-8" style={{ color: '#059669' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: '#164E63' }}>You&apos;re on the list!</h3>
                                <p className="text-sm" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                                    We&apos;ll reach out within 1 business day to schedule your demo.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                                <h3 className="text-xl font-bold mb-6" style={{ color: '#164E63' }}>Request a Demo</h3>

                                {[
                                    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
                                    { id: 'email', label: 'Work Email', type: 'email', placeholder: 'jane@yourhouse.com' },
                                    { id: 'company', label: 'House / Organization Name', type: 'text', placeholder: 'Sunrise Sober Living' },
                                ].map((field) => (
                                    <div key={field.id}>
                                        <label htmlFor={field.id} className="block text-sm font-medium mb-1.5" style={{ color: '#164E63' }}>
                                            {field.label}
                                        </label>
                                        <input
                                            id={field.id}
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            required
                                            value={form[field.id as keyof typeof form]}
                                            onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                                            style={{
                                                background: 'white',
                                                border: '1px solid rgba(8,145,178,0.2)',
                                                color: '#164E63',
                                                fontFamily: 'var(--font-noto), sans-serif',
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = '#0891B2')}
                                            onBlur={(e) => (e.target.style.borderColor = 'rgba(8,145,178,0.2)')}
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: '#164E63' }}>
                                        Anything else? (optional)
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={3}
                                        placeholder="How many beds do you manage? What's your biggest challenge today?"
                                        value={form.message}
                                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200 outline-none"
                                        style={{
                                            background: 'white',
                                            border: '1px solid rgba(8,145,178,0.2)',
                                            color: '#164E63',
                                            fontFamily: 'var(--font-noto), sans-serif',
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = '#0891B2')}
                                        onBlur={(e) => (e.target.style.borderColor = 'rgba(8,145,178,0.2)')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:opacity-90 disabled:opacity-60"
                                    style={{ background: '#059669' }}
                                >
                                    {loading ? 'Sending…' : 'Request Demo →'}
                                </button>

                                <p className="text-xs text-center" style={{ color: '#164E63', opacity: 0.5, fontFamily: 'var(--font-noto), sans-serif' }}>
                                    We respect your privacy. No spam, ever.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
