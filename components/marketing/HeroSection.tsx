import { AppStoreBadges } from './AppStoreBadges';

export function HeroSection() {
    return (
        <section
            className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center overflow-hidden"
            style={{
                background: 'linear-gradient(160deg, #ECFEFF 0%, #f0fdfa 50%, #ECFEFF 100%)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Soft background orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0891B2, transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #059669, transparent)' }} />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                    style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: '1px solid rgba(8,145,178,0.2)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#059669' }} />
                    Now with Gemini AI Recovery Guide
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ color: '#164E63' }}>
                    Run a Better<br />
                    <span style={{ color: '#0891B2' }}>Sober Living House.</span>
                    <br />
                    <span style={{ color: '#059669' }}>Change More Lives.</span>
                </h1>

                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                    style={{ color: '#164E63', opacity: 0.75, fontFamily: 'var(--font-noto), sans-serif' }}>
                    The all-in-one platform for sober living operators — property management,
                    resident LMS, AI recovery coaching, and scheduling. All in one place.
                </p>

                {/* 3 CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                    {/* Primary: Operator Demo */}
                    <a
                        href="#demo"
                        id="cta-schedule-demo"
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 cursor-pointer hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
                        style={{ background: '#059669', boxShadow: '0 8px 24px rgba(5,150,105,0.35)' }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        Schedule a Demo
                    </a>

                    {/* Secondary: Find a Bed → App */}
                    <a
                        href="#"
                        id="cta-find-bed"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                        style={{
                            background: 'rgba(8,145,178,0.08)',
                            color: '#0891B2',
                            border: '2px solid rgba(8,145,178,0.3)',
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Find a Bed
                    </a>

                    {/* Tertiary: Solo Recovery → App */}
                    <a
                        href="#"
                        id="cta-solo-recovery"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                        style={{
                            background: 'rgba(22,78,99,0.06)',
                            color: '#164E63',
                            border: '2px solid rgba(22,78,99,0.15)',
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                        </svg>
                        Start AI Recovery
                    </a>
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
