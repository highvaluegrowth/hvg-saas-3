'use client';

const problems = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75" />
            </svg>
        ),
        problem: 'Spreadsheets & binders',
        solution: 'Unified digital dashboard',
        color: '#EF4444',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        ),
        problem: 'No resident engagement',
        solution: 'Gamified LMS with streaks',
        color: '#F97316',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
        ),
        problem: 'Relapse goes undetected',
        solution: 'AI flags early warning signs',
        color: '#EAB308',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
        ),
        problem: 'Revenue leakage',
        solution: 'Automated rent + fee tracking',
        color: '#8B5CF6',
    },
];

export function ProblemSection() {
    return (
        <section
            id="operators"
            className="py-24 px-6"
            style={{ background: '#fff', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(8,145,178,0.08)', color: '#0891B2' }}>
                        The Real Problem
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#164E63' }}>
                        Running sober living is hard.<br />It doesn&apos;t have to be.
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                        Most operators are juggling five different tools, paper sign-in sheets,
                        and gut-feel decisions. HVG replaces all of that.
                    </p>
                </div>

                {/* Problem → Solution grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {problems.map((item) => (
                        <div
                            key={item.problem}
                            className="rounded-2xl p-6 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            style={{
                                background: '#ECFEFF',
                                boxShadow: '0 4px 16px rgba(8,145,178,0.08)',
                                border: '1px solid rgba(8,145,178,0.1)',
                            }}
                        >
                            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: `${item.color}15`, color: item.color }}>
                                {item.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium line-through opacity-50" style={{ color: '#164E63' }}>
                                        {item.problem}
                                    </span>
                                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </div>
                                <div className="text-base font-semibold" style={{ color: '#164E63' }}>{item.solution}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
