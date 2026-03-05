export function OperationsSection() {
    const tiles = [
        {
            icon: '🏠',
            label: 'Houses & Beds',
            desc: 'Real-time capacity tracking, bed assignments, and availability across all your locations.',
            accent: '#059669',
            accentBg: 'rgba(5,150,105,0.1)',
        },
        {
            icon: '👥',
            label: 'Residents & Staff',
            desc: 'Full profiles, phase tracking, RBAC roles, and onboarding workflows for everyone in your program.',
            accent: '#0891B2',
            accentBg: 'rgba(8,145,178,0.1)',
        },
        {
            icon: '📋',
            label: 'Incident Reports',
            desc: 'Structured incident documentation, escalation workflows, and full audit history — always audit-ready.',
            accent: '#DC2626',
            accentBg: 'rgba(220,38,38,0.1)',
        },
        {
            icon: '✅',
            label: 'Chores & Tasks',
            desc: 'Assign household chores to residents and staff, track completion, and enforce accountability.',
            accent: '#7C3AED',
            accentBg: 'rgba(124,58,237,0.1)',
        },
        {
            icon: '🚗',
            label: 'Vehicles & Rides',
            desc: 'Fleet management, ride request queue, route tracking, and driver assignments — all in one view.',
            accent: '#D97706',
            accentBg: 'rgba(217,119,6,0.1)',
        },
        {
            icon: '📅',
            label: 'Events & Calendar',
            desc: 'Schedule house meetings, group sessions, and outings. RSVP tracking and automated reminders built in.',
            accent: '#0369A1',
            accentBg: 'rgba(3,105,161,0.1)',
        },
    ];

    return (
        <section
            className="py-24 px-6"
            style={{
                background: '#fff',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}
                    >
                        Full Platform Operations
                    </div>
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                        style={{ color: '#164E63' }}
                    >
                        Run your whole operation
                        <br />
                        <span style={{ color: '#059669' }}>from one screen.</span>
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        Every operational tool your recovery house needs — unified, mobile-ready, and built for the realities of sober living management.
                    </p>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tiles.map((tile) => (
                        <div
                            key={tile.label}
                            className="rounded-2xl p-6 transition-transform hover:-translate-y-1"
                            style={{
                                background: tile.accentBg,
                                border: `1px solid ${tile.accent}25`,
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                                style={{ background: '#fff', boxShadow: `0 2px 12px ${tile.accent}20` }}
                            >
                                {tile.icon}
                            </div>
                            <h3
                                className="text-base font-bold mb-2"
                                style={{ color: '#164E63' }}
                            >
                                {tile.label}
                            </h3>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}
                            >
                                {tile.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom callout */}
                <div
                    className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left"
                    style={{
                        background: 'linear-gradient(135deg, #ECFEFF 0%, #F0FDF4 100%)',
                        border: '1px solid rgba(5,150,105,0.2)',
                    }}
                >
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#164E63' }}>
                            Everything your staff needs. Nothing they don&apos;t.
                        </h3>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}
                        >
                            Role-based access means house managers see what they need, residents see what they need, and administrators see everything — all from the same platform.
                        </p>
                    </div>
                    <a
                        href="#demo"
                        className="px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-opacity hover:opacity-90"
                        style={{ background: '#059669', color: '#fff' }}
                    >
                        See It in Action →
                    </a>
                </div>
            </div>
        </section>
    );
}
