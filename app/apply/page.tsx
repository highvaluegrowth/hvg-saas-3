'use client';

import Link from 'next/link';

interface ApplicationCard {
    icon: string;
    title: string;
    description: string;
    href: string | null;
    cta: string;
    disabled?: boolean;
    note?: string;
}

const APPLICATION_TYPES: ApplicationCard[] = [
    {
        icon: '🏢',
        title: 'Partner / Operator Application',
        description:
            'Own or manage a sober-living facility? Apply to join the HVG network as a partner operator. Gain access to our resident-matching platform, compliance tools, and AI-powered management suite.',
        href: null,
        cta: 'How to Apply',
        disabled: true,
        note: 'To begin a partner application, create a free account and start the onboarding wizard from your dashboard.',
    },
    {
        icon: '🛏️',
        title: 'Resident Bed Application',
        description:
            'Looking for a sober-living home? Submit an application and we will match you with available beds near you based on your recovery goals, preferences, and funding source.',
        href: '/apply/bed',
        cta: 'Start Application',
    },
    {
        icon: '💼',
        title: 'Staff / Job Application',
        description:
            'Interested in working at a sober-living house? Apply to positions such as House Manager, Counselor, Peer Support Specialist, and more across our partner network.',
        href: '/apply/staff',
        cta: 'Start Application',
    },
    {
        icon: '📚',
        title: 'Course Enrollment',
        description:
            'Residents and staff can enroll in recovery education courses directly through the HVG platform. Browse available courses and submit your enrollment application.',
        href: '/apply/course/general',
        cta: 'Start Enrollment',
    },
    {
        icon: '📅',
        title: 'Event Registration',
        description:
            'Community events, group meetings, and recovery workshops are posted by partner operators. Register for upcoming events through this application form.',
        href: '/apply/event/general',
        cta: 'Register Now',
    },
];

export default function ApplyLandingPage() {
    return (
        <div className="flex-1 container mx-auto max-w-4xl py-12 px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Applications</h2>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Choose the application type that fits your situation. Our team reviews every submission and will
                    follow up with next steps.
                </p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {APPLICATION_TYPES.map(card => (
                    <div
                        key={card.title}
                        className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col ${
                            card.disabled ? 'opacity-70' : ''
                        }`}
                    >
                        {/* Icon */}
                        <div className="text-3xl mb-3">{card.icon}</div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>

                        {/* Description */}
                        <p className="text-sm text-slate-500 flex-1 mb-4">{card.description}</p>

                        {/* Inline note for disabled cards */}
                        {card.note && (
                            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                                {card.note}
                            </div>
                        )}

                        {/* CTA */}
                        {card.href ? (
                            <Link
                                href={card.href}
                                className="inline-flex items-center justify-center px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors self-start"
                            >
                                {card.cta}
                                <svg
                                    className="ml-2 w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        ) : (
                            <span className="inline-flex items-center px-5 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed self-start select-none">
                                {card.cta}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div className="mt-10 text-center">
                <p className="text-xs text-slate-400">
                    Questions about an application?{' '}
                    <a
                        href="mailto:support@hvg.com"
                        className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                    >
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
