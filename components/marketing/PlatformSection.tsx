'use client';

import { useState } from 'react';

const tabs = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
        ),
        headline: 'Everything at a glance',
        description: 'One dashboard for all your houses, residents, and KPIs. Know which beds are filled, who\'s behind on rent, and which residents need a check-in — in under 60 seconds.',
        bullets: ['Occupancy & bed management', 'Rent tracking & payment status', 'Incident log & house rules', 'Multi-property view'],
        preview: (
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Occupancy', value: '94%', color: '#059669' },
                        { label: 'Rent Collected', value: '$8,240', color: '#0891B2' },
                        { label: 'Open Incidents', value: '2', color: '#F97316' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.1)' }}>
                            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#164E63', opacity: 0.6 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(8,145,178,0.1)' }}>
                    {['James W. · Room 4 · ✓ Paid', 'Maria G. · Room 7 · ⚠ Rent Due', 'Darius L. · Room 2 · ✓ Paid'].map((row, i) => (
                        <div key={row} className="px-3 py-2.5 text-xs flex justify-between items-center border-b last:border-0"
                            style={{ background: i % 2 === 0 ? 'white' : 'rgba(8,145,178,0.02)', borderColor: 'rgba(8,145,178,0.08)', color: '#164E63' }}>
                            <span>{row.split('·')[0]}</span>
                            <span className="font-medium">{row.split('·')[2].trim()}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 'lms',
        label: 'LMS',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
        ),
        headline: 'Recovery curricula that actually works',
        description: 'Build structured programs with 12 question types, video lessons, and AI-generated content. Residents learn on the app; you track completion on the dashboard.',
        bullets: ['12 quiz & lesson types', 'Drag-and-drop course builder', 'Streaks + milestone badges', '78% avg completion rate'],
        preview: (
            <div className="space-y-2">
                <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(8,145,178,0.08)', color: '#0891B2' }}>
                    📚 Module 3: Relapse Prevention
                </div>
                {[
                    { label: 'Lesson: Triggers & Coping', done: true },
                    { label: 'Quiz: Scenario Practice', done: true },
                    { label: 'Video: Expert Interview', done: false },
                    { label: 'Assignment: Reflection Journal', done: false },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
                        style={{ background: item.done ? 'rgba(5,150,105,0.07)' : 'white', border: '1px solid rgba(8,145,178,0.08)', color: '#164E63' }}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${item.done ? 'bg-emerald-500 text-white' : 'border border-gray-200 text-gray-300'}`}>
                            {item.done ? '✓' : ''}
                        </div>
                        {item.label}
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(8,145,178,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: '50%', background: '#059669' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#059669' }}>50%</span>
                </div>
            </div>
        ),
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
        headline: 'Know who needs you before they ask',
        description: 'AI-assisted resident analytics flags disengagement patterns — declining course activity, missed chores, mood dips — before they become a crisis call at 2am.',
        bullets: ['Engagement & mood trends', 'Early warning AI alerts', 'Course completion tracking', 'Sobriety milestone reporting'],
        preview: (
            <div className="space-y-3">
                <div className="flex gap-1.5 items-end h-16">
                    {[45, 62, 58, 75, 68, 88, 82, 91, 78, 95, 88, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i >= 9 ? '#059669' : 'rgba(8,145,178,0.2)' }} />
                    ))}
                </div>
                <div className="text-xs" style={{ color: '#164E63', opacity: 0.5 }}>LMS completion — last 12 weeks</div>
                <div className="space-y-2 pt-1">
                    {[
                        { name: 'James W.', bar: 92, color: '#059669' },
                        { name: 'Maria G.', bar: 34, color: '#F97316', alert: true },
                        { name: 'Darius L.', bar: 78, color: '#0891B2' },
                    ].map((r) => (
                        <div key={r.name} className="flex items-center gap-2 text-xs" style={{ color: '#164E63' }}>
                            <span className="w-16 flex-shrink-0">{r.name}</span>
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(8,145,178,0.1)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${r.bar}%`, background: r.color }} />
                            </div>
                            <span className="w-8 text-right font-medium">{r.bar}%</span>
                            {r.alert && <span className="text-orange-400 font-bold">⚠</span>}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 'operations',
        label: 'Operations',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        ),
        headline: 'Run the house without the headaches',
        description: 'Chores, maintenance, vehicles, events, contracts — all managed in one place. Staff get their assignments, residents see their responsibilities, and nothing falls through the cracks.',
        bullets: ['Chore & maintenance scheduling', 'Vehicle & ride management', 'Digital contracts + e-sign', 'Event calendar & RSVPs'],
        preview: (
            <div className="space-y-2">
                {[
                    { task: 'Kitchen deep clean', who: 'James W.', status: '✓ Done', color: '#059669' },
                    { task: 'Bathroom — Floor 2', who: 'Maria G.', status: '⏳ Due today', color: '#F97316' },
                    { task: 'Trash to curb', who: 'Darius L.', status: '✓ Done', color: '#059669' },
                    { task: 'Laundry room wipe', who: 'Kevin P.', status: '● Pending', color: '#94A3B8' },
                ].map((item) => (
                    <div key={item.task} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs"
                        style={{ background: 'white', border: '1px solid rgba(8,145,178,0.08)', color: '#164E63' }}>
                        <div>
                            <div className="font-medium">{item.task}</div>
                            <div style={{ color: '#64748B' }}>{item.who}</div>
                        </div>
                        <span className="font-semibold" style={{ color: item.color }}>{item.status}</span>
                    </div>
                ))}
            </div>
        ),
    },
];

export function PlatformSection() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

    return (
        <section
            className="py-28 px-6 overflow-hidden"
            style={{ background: '#ECFEFF', fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                        style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2' }}
                    >
                        For Operators
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: '#164E63' }}>
                        One platform. Every tool<br />your house needs.
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: '#164E63', opacity: 0.65, fontFamily: 'var(--font-noto), sans-serif' }}>
                        From intake to graduation — HVG manages the full resident journey so you can focus on what matters most.
                    </p>
                </div>

                {/* Tab navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                            style={{
                                background: activeTab === tab.id ? '#0891B2' : 'white',
                                color: activeTab === tab.id ? 'white' : '#164E63',
                                border: '1px solid',
                                borderColor: activeTab === tab.id ? '#0891B2' : 'rgba(8,145,178,0.15)',
                                boxShadow: activeTab === tab.id ? '0 4px 16px rgba(8,145,178,0.3)' : 'none',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Feature panel */}
                <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-10 rounded-3xl p-8 md:p-12"
                    style={{
                        background: 'white',
                        border: '1px solid rgba(8,145,178,0.12)',
                        boxShadow: '0 8px 40px rgba(8,145,178,0.1)',
                    }}
                >
                    {/* Left: copy */}
                    <div className="flex flex-col justify-center">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-snug" style={{ color: '#0C1A2E' }}>
                            {active.headline}
                        </h3>
                        <p
                            className="text-base leading-relaxed mb-8"
                            style={{ color: '#4A6070', fontFamily: 'var(--font-noto), sans-serif' }}
                        >
                            {active.description}
                        </p>
                        <ul className="space-y-3">
                            {active.bullets.map((b) => (
                                <li key={b} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                                        style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2' }}>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: '#164E63' }}>{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: live preview */}
                    <div
                        className="rounded-2xl p-6"
                        style={{
                            background: '#F8FBFF',
                            border: '1px solid rgba(8,145,178,0.1)',
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            <span className="ml-2 text-xs font-mono" style={{ color: '#94A3B8' }}>hvg.app / dashboard</span>
                        </div>
                        {active.preview}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <a
                        href="#demo"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:opacity-90 hover:-translate-y-0.5"
                        style={{ background: '#059669', boxShadow: '0 8px 24px rgba(5,150,105,0.3)' }}
                    >
                        Schedule a Free Demo
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
