'use client';

// Bento Grid layout showcasing Operator LMS & Property Management features
const bentoItems = [
    {
        id: 'lms-builder',
        colSpan: 'md:col-span-2',
        rowSpan: 'md:row-span-2',
        title: 'Course Builder',
        description: 'Create recovery curricula with 12 question types, video embeds, and AI-assisted content generation. Drag-and-drop lesson ordering.',
        badge: 'LMS',
        badgeColor: '#0891B2',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
        ),
        preview: (
            <div className="mt-4 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(8,145,178,0.15)' }}>
                <div className="px-4 py-3 border-b text-xs font-medium" style={{ background: 'rgba(8,145,178,0.06)', color: '#0891B2', borderColor: 'rgba(8,145,178,0.15)' }}>
                    Module 3: Relapse Prevention
                </div>
                {['Lesson: Triggers & Coping', 'Quiz: Scenario Practice', 'Video: Expert Interview', 'Assignment: Reflection'].map((item, i) => (
                    <div key={item} className="flex items-center gap-3 px-4 py-2.5 text-sm border-b last:border-0"
                        style={{ background: i === 0 ? 'rgba(5,150,105,0.06)' : 'white', borderColor: 'rgba(8,145,178,0.08)', color: '#164E63' }}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${i === 0 ? 'bg-green-500 text-white' : 'border border-gray-200'}`}>
                            {i === 0 ? '✓' : i + 1}
                        </div>
                        {item}
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: 'leaderboard',
        colSpan: 'md:col-span-1',
        title: 'Gamified Leaderboard',
        description: 'Points, streaks, and badges that motivate residents to complete courses and maintain sobriety.',
        badge: 'LMS',
        badgeColor: '#059669',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
            </svg>
        ),
    },
    {
        id: 'property',
        colSpan: 'md:col-span-1',
        title: 'Property Management',
        description: 'Track beds, rent payments, maintenance requests, and house rules — all in one dashboard.',
        badge: 'Ops',
        badgeColor: '#164E63',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
    },
    {
        id: 'analytics',
        colSpan: 'md:col-span-2',
        title: 'Resident Analytics',
        description: 'Know which residents are thriving and who needs check-in — before problems become crises.',
        badge: 'Insights',
        badgeColor: '#0891B2',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
        preview: (
            <div className="mt-4 flex gap-2 items-end h-14">
                {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all duration-300" style={{ height: `${h}%`, background: i === 5 ? '#059669' : 'rgba(8,145,178,0.25)' }} />
                ))}
            </div>
        ),
    },
];

export function PlatformSection() {
    return (
        <section
            className="py-24 px-6"
            style={{ background: '#ECFEFF', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2' }}>
                        For Operators
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#164E63' }}>
                        Everything you need to run a<br />professional sober living house.
                    </h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-auto">
                    {bentoItems.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-2xl p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${item.colSpan ?? ''} ${item.rowSpan ?? ''}`}
                            style={{
                                background: 'white',
                                boxShadow: '0 4px 20px rgba(8,145,178,0.08)',
                                border: '1px solid rgba(8,145,178,0.1)',
                            }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ background: `${item.badgeColor}12`, color: item.badgeColor }}>
                                    {item.icon}
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{ background: `${item.badgeColor}12`, color: item.badgeColor }}>
                                    {item.badge}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: '#164E63' }}>{item.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                                {item.description}
                            </p>
                            {item.preview && item.preview}
                        </div>
                    ))}
                </div>

                {/* Operator CTA */}
                <div className="text-center mt-12">
                    <a
                        href="#demo"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-200 cursor-pointer hover:opacity-90 hover:-translate-y-0.5"
                        style={{ background: '#059669', boxShadow: '0 8px 24px rgba(5,150,105,0.3)' }}
                    >
                        Schedule a Demo
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
