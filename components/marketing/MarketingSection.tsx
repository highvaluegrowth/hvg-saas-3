export function MarketingSection() {
    const platforms = [
        { name: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.15)' },
        { name: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.15)' },
        { name: 'TikTok', color: '#69C9D0', bg: 'rgba(105,201,208,0.15)' },
        { name: 'X / Twitter', color: '#fff', bg: 'rgba(255,255,255,0.1)' },
        { name: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.15)' },
    ];

    const features = [
        {
            icon: '✍️',
            title: 'AI Post Drafting',
            desc: 'Describe what you want to share. The AI writes scroll-stopping posts in your brand voice — instantly.',
        },
        {
            icon: '📅',
            title: 'Multi-Platform Scheduler',
            desc: 'Queue posts for Facebook, Instagram, TikTok, X, and LinkedIn from one calendar. Set it and forget it.',
        },
        {
            icon: '📊',
            title: 'Performance Analytics',
            desc: 'See reach, engagement, and follower growth across all platforms in a single unified dashboard.',
        },
        {
            icon: '🎯',
            title: 'Brand Voice AI',
            desc: 'Train the AI on your organization\'s tone — compassionate, professional, faith-based, or community-focused.',
        },
        {
            icon: '⚡',
            title: 'Auto-Posting Cron',
            desc: 'Scheduled posts fire automatically, even while you\'re doing intake or running a house meeting.',
        },
        {
            icon: '🖼️',
            title: 'Image & Media Support',
            desc: 'Upload photos, attach to posts, and preview how they\'ll look on each platform before publishing.',
        },
    ];

    return (
        <section
            className="py-24 px-6"
            style={{
                background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1630 100%)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                        Social Media Marketing Suite
                    </div>
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                        style={{ color: '#f8fafc' }}
                    >
                        Your entire marketing department.
                        <br />
                        <span style={{ color: '#818cf8' }}>Built in.</span>
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#94a3b8', fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        One platform to draft, schedule, publish, and analyze your social media presence — powered by AI that knows the recovery housing space.
                    </p>

                    {/* Platform pills */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {platforms.map((p) => (
                            <span
                                key={p.name}
                                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                                style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}
                            >
                                {p.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="rounded-2xl p-6 transition-transform hover:-translate-y-1"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div className="text-3xl mb-4">{f.icon}</div>
                            <h3 className="text-base font-bold mb-2" style={{ color: '#f1f5f9' }}>
                                {f.title}
                            </h3>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: '#64748b', fontFamily: 'var(--font-noto), sans-serif' }}
                            >
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Compose flow mockup */}
                <div
                    className="mt-12 rounded-2xl p-6 md:p-8"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}
                >
                    <p className="text-xs font-medium uppercase tracking-widest mb-5" style={{ color: '#6366f1' }}>
                        Live workflow
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        {[
                            { step: '1', label: 'Describe your post', sub: '"Celebrate 30 days sober, recovery is possible"' },
                            { arrow: true },
                            { step: '2', label: 'AI drafts content', sub: 'Tailored copy for each platform' },
                            { arrow: true },
                            { step: '3', label: 'Pick platforms & time', sub: 'Schedule or publish now' },
                            { arrow: true },
                            { step: '4', label: 'Track performance', sub: 'Views, likes, follows in one dashboard' },
                        ].map((item, i) =>
                            'arrow' in item ? (
                                <div key={i} className="text-2xl hidden md:block" style={{ color: '#334155' }}>→</div>
                            ) : (
                                <div
                                    key={i}
                                    className="flex-1 rounded-xl p-4"
                                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                                >
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto md:mx-0 mb-2"
                                        style={{ background: '#6366f1', color: '#fff' }}
                                    >
                                        {item.step}
                                    </div>
                                    <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>{item.label}</p>
                                    <p className="text-xs" style={{ color: '#64748b', fontFamily: 'var(--font-noto), sans-serif' }}>{item.sub}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
