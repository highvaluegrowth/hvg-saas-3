import Link from 'next/link';
import { AppStoreBadges } from './AppStoreBadges';

const AUDIENCE_CARDS = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
        label: 'For Operators',
        headline: 'Run your houses smarter.',
        body: 'AI tools, resident LMS, social marketing, billing, and analytics — all in one dashboard.',
        cta: { label: 'Get a Demo →', href: '#demo', style: { background: '#0891B2', color: '#fff' } as React.CSSProperties },
        accent: '#0891B2',
        bg: 'rgba(8,145,178,0.06)',
        border: 'rgba(8,145,178,0.18)',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
        ),
        label: 'Find a Bed',
        headline: 'Find your next step.',
        body: 'Browse available sober living beds, submit your application, and get matched with the right house.',
        cta: { label: 'Apply Now →', href: '/apply/bed', style: { background: '#059669', color: '#fff' } as React.CSSProperties },
        accent: '#059669',
        bg: 'rgba(5,150,105,0.06)',
        border: 'rgba(5,150,105,0.18)',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
            </svg>
        ),
        label: 'For Residents',
        headline: 'Recovery support in your pocket.',
        body: 'AI recovery guide, sobriety tracking, courses, meetings, and daily check-ins — all on your phone.',
        cta: null,
        accent: '#7C3AED',
        bg: 'rgba(124,58,237,0.06)',
        border: 'rgba(124,58,237,0.18)',
    },
] as const;

export function HeroSection() {
    return (
        <section
            className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden"
            style={{
                background: 'linear-gradient(160deg, #ECFEFF 0%, #f0fdfa 50%, #ECFEFF 100%)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Background orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0891B2, transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #059669, transparent)' }} />
            <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />

            <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                    style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: '1px solid rgba(8,145,178,0.2)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#059669' }} />
                    Powered by Gemini AI · Built for Recovery
                </div>

                {/* Main headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-5" style={{ color: '#164E63' }}>
                    Recovery Housing.<br />
                    <span style={{ color: '#0891B2' }}>Reimagined.</span>
                </h1>

                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-14 leading-relaxed"
                    style={{ color: '#164E63', opacity: 0.7, fontFamily: 'var(--font-noto), sans-serif' }}>
                    Supporting operators, residents, and applicants —<br className="hidden md:block" />
                    every step of the recovery journey.
                </p>

                {/* Three audience cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14 text-left">
                    {AUDIENCE_CARDS.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
                            style={{ background: card.bg, border: `1px solid ${card.border}` }}
                        >
                            {/* Icon + label */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: `${card.accent}18`, color: card.accent }}
                                >
                                    {card.icon}
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: card.accent }}>
                                    {card.label}
                                </span>
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="text-lg font-bold mb-1" style={{ color: '#164E63' }}>{card.headline}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                                    {card.body}
                                </p>
                            </div>

                            {/* CTA */}
                            {card.cta ? (
                                <Link
                                    href={card.cta.href}
                                    className="mt-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                                    style={card.cta.style}
                                >
                                    {card.cta.label}
                                </Link>
                            ) : (
                                <div className="mt-auto">
                                    <AppStoreBadges />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {[
                        { value: '94%', label: '30-day retention rate' },
                        { value: '3x', label: 'faster house onboarding' },
                        { value: '100%', label: 'HIPAA-aware mobile app' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-2xl font-bold" style={{ color: '#0891B2' }}>{stat.value}</div>
                            <div className="text-sm mt-0.5" style={{ color: '#164E63', opacity: 0.6, fontFamily: 'var(--font-noto), sans-serif' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
