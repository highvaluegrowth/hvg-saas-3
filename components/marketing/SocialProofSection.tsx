'use client';

const testimonials = [
    { quote: "HVG cut my administrative time by half. I spend more time with residents now.", name: 'Marcus T.', role: 'House Manager, Phoenix AZ' },
    { quote: "The AI coach helped me get through my hardest week in early recovery.", name: 'Jordan R.', role: 'Resident, 90 days sober' },
    { quote: "LMS completion rates went from 20% to 78% after we switched to HVG.", name: 'Sandra L.', role: 'Program Director' },
    { quote: "Finally, software that understands the sober living industry.", name: 'David K.', role: 'Owner, 3 houses' },
    { quote: "The gamification keeps residents engaged in a way we've never seen before.", name: 'Priya M.', role: 'Clinical Coordinator' },
    { quote: "I can check on all 3 of my properties from my phone in 10 minutes.", name: 'Ray J.', role: 'Multi-property Operator' },
];

const metrics = [
    { value: '78%', label: 'LMS completion rate' },
    { value: '94%', label: '30-day retention' },
    { value: '3.2x', label: 'faster onboarding' },
    { value: '50%', label: 'less admin time' },
];

export function SocialProofSection() {
    // Duplicate for seamless loop
    const allTestimonials = [...testimonials, ...testimonials];

    return (
        <section
            className="py-24 overflow-hidden"
            style={{ background: '#ECFEFF', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto px-6 mb-14">
                <div className="text-center">
                    <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2' }}>
                        What people are saying
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#164E63' }}>
                        Trusted by operators.<br />Loved by residents.
                    </h2>
                </div>
            </div>

            {/* Metrics */}
            <div className="max-w-4xl mx-auto px-6 mb-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {metrics.map((m) => (
                        <div key={m.label} className="text-center rounded-2xl py-6 px-4"
                            style={{ background: 'white', boxShadow: '0 4px 16px rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.1)' }}>
                            <div className="text-3xl font-bold mb-1" style={{ color: '#059669' }}>{m.value}</div>
                            <div className="text-xs" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Marquee testimonials */}
            <div
                className="relative flex"
                style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
            >
                <div
                    className="flex gap-5 animate-marquee"
                    style={{ animationDuration: '40s' }}
                    aria-hidden="true"
                >
                    {allTestimonials.map((t, i) => (
                        <div
                            key={`${t.name}-${i}`}
                            className="flex-shrink-0 w-72 rounded-2xl p-5"
                            style={{
                                background: 'white',
                                boxShadow: '0 4px 16px rgba(8,145,178,0.08)',
                                border: '1px solid rgba(8,145,178,0.1)',
                            }}
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-3">
                                {Array.from({ length: 5 }).map((_, si) => (
                                    <svg key={si} className="w-4 h-4" viewBox="0 0 20 20" fill="#F59E0B">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#164E63', fontFamily: 'var(--font-noto), sans-serif' }}>
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ background: 'rgba(8,145,178,0.15)', color: '#0891B2' }}>
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold" style={{ color: '#164E63' }}>{t.name}</div>
                                    <div className="text-xs" style={{ color: '#164E63', opacity: 0.55 }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
        </section>
    );
}
