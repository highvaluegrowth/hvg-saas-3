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

                {/* CTAs */}
                <div className="flex flex-col items-center justify-center gap-6 mb-14">
                    <AppStoreBadges />
                    <a
                        href="#demo"
                        className="text-sm font-semibold leading-6 text-emerald-600 hover:text-emerald-500"
                    >
                        Are you an operator? Schedule a demo &rarr;
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
