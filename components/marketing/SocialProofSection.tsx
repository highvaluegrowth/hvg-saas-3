'use client';

const metrics = [
    { value: '78%', label: 'LMS completion rate', sub: 'vs. 20% industry avg', icon: '📈' },
    { value: '94%', label: '30-day retention', sub: 'among enrolled residents', icon: '🏠' },
    { value: '3.2×', label: 'faster onboarding', sub: 'vs. manual intake', icon: '⚡' },
    { value: '50%', label: 'less admin time', sub: 'per operator per week', icon: '⏱' },
];

const testimonials = [
    {
        quote: "HVG cut my administrative time by half. I used to dread Mondays. Now I actually look forward to checking in with residents.",
        name: 'Marcus T.',
        role: 'House Manager',
        location: 'Phoenix, AZ',
        type: 'Operator',
        color: '#0891B2',
        rating: 5,
    },
    {
        quote: "The AI coach got me through my hardest week. It was 1am and I was craving hard. I typed it out and it walked me through the whole thing. No judgment.",
        name: 'Jordan R.',
        role: '90 days sober',
        location: 'Resident',
        type: 'Resident',
        color: '#059669',
        rating: 5,
    },
    {
        quote: "LMS completion went from 20% to 78% after we switched. Residents actually compete to finish first now. Gamification works.",
        name: 'Sandra L.',
        role: 'Program Director',
        location: 'Denver, CO',
        type: 'Operator',
        color: '#0891B2',
        rating: 5,
    },
    {
        quote: "Finally software that actually understands how sober living works. Everything else felt like we were adapting a tool built for hotels.",
        name: 'David K.',
        role: 'Owner · 3 houses',
        location: 'Austin, TX',
        type: 'Operator',
        color: '#67E8F9',
        rating: 5,
    },
    {
        quote: "I check on all three properties from my phone every morning in ten minutes. Used to take me half a day running between locations.",
        name: 'Ray J.',
        role: 'Multi-property Operator',
        location: 'Las Vegas, NV',
        type: 'Operator',
        color: '#0891B2',
        rating: 5,
    },
    {
        quote: "The sobriety tracker and badges might sound small, but they meant everything to me in early recovery. Every day felt celebrated.",
        name: 'Priya M.',
        role: '6 months sober',
        location: 'Resident',
        type: 'Resident',
        color: '#059669',
        rating: 5,
    },
];

function StarRating({ count }: { count: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: count }).map((_, i) => (
                <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#F59E0B">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                </svg>
            ))}
        </div>
    );
}

export function SocialProofSection() {
    return (
        <section
            className="py-28 px-6 relative overflow-hidden"
            style={{
                background: '#0A1628',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Top separator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(52,211,153,0.3), transparent)' }} />
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(8,145,178,0.03) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                }} />

            <div className="max-w-6xl mx-auto relative">

                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                        style={{ background: 'rgba(8,145,178,0.12)', color: '#67E8F9', border: '1px solid rgba(8,145,178,0.22)' }}
                    >
                        Real results
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-white">
                        Trusted by operators.<br />
                        <span style={{ color: '#34D399' }}>Life-changing for residents.</span>
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-noto), sans-serif' }}>
                        From house managers to residents in early recovery — here&apos;s what they&apos;re saying.
                    </p>
                </div>

                {/* Metrics bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {metrics.map((m) => (
                        <div
                            key={m.label}
                            className="rounded-2xl p-6 text-center transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div className="text-2xl mb-2">{m.icon}</div>
                            <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: '#34D399' }}>{m.value}</div>
                            <div className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{m.label}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-noto), sans-serif' }}>{m.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Testimonial grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className="flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            {/* Top row: stars + badge */}
                            <div className="flex items-center justify-between mb-4">
                                <StarRating count={t.rating} />
                                <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{
                                        background: t.type === 'Resident' ? 'rgba(52,211,153,0.12)' : 'rgba(8,145,178,0.12)',
                                        color: t.type === 'Resident' ? '#34D399' : '#67E8F9',
                                    }}
                                >
                                    {t.type}
                                </span>
                            </div>

                            {/* Quote */}
                            <p
                                className="text-sm leading-relaxed flex-1 mb-5"
                                style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-noto), sans-serif' }}
                            >
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Attribution */}
                            <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                    style={{ background: `${t.color}20`, color: t.color }}
                                >
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{t.name}</div>
                                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.location}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
