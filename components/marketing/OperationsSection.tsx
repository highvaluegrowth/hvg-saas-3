'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
    Home,
    Users,
    FileText,
    CheckSquare,
    Car,
    CalendarDays,
} from 'lucide-react';

const tiles = [
    {
        Icon: Home,
        label: 'Houses & Beds',
        desc: 'Real-time capacity tracking, bed assignments, and availability across all your locations.',
        accent: '#059669',
        accentBg: 'rgba(5,150,105,0.08)',
        accentBorder: 'rgba(5,150,105,0.18)',
        shadow: 'rgba(5,150,105,0.22)',
    },
    {
        Icon: Users,
        label: 'Residents & Staff',
        desc: 'Full profiles, phase tracking, RBAC roles, and onboarding workflows for everyone in your program.',
        accent: '#0891B2',
        accentBg: 'rgba(8,145,178,0.08)',
        accentBorder: 'rgba(8,145,178,0.18)',
        shadow: 'rgba(8,145,178,0.22)',
    },
    {
        Icon: FileText,
        label: 'Incident Reports',
        desc: 'Structured incident documentation, escalation workflows, and full audit history — always audit-ready.',
        accent: '#DC2626',
        accentBg: 'rgba(220,38,38,0.08)',
        accentBorder: 'rgba(220,38,38,0.18)',
        shadow: 'rgba(220,38,38,0.22)',
    },
    {
        Icon: CheckSquare,
        label: 'Chores & Tasks',
        desc: 'Assign household chores to residents and staff, track completion, and enforce accountability.',
        accent: '#0891B2',
        accentBg: 'rgba(8,145,178,0.08)',
        accentBorder: 'rgba(8,145,178,0.18)',
        shadow: 'rgba(8,145,178,0.22)',
    },
    {
        Icon: Car,
        label: 'Vehicles & Rides',
        desc: 'Fleet management, ride request queue, route tracking, and driver assignments — all in one view.',
        accent: '#D97706',
        accentBg: 'rgba(217,119,6,0.08)',
        accentBorder: 'rgba(217,119,6,0.18)',
        shadow: 'rgba(217,119,6,0.22)',
    },
    {
        Icon: CalendarDays,
        label: 'Events & Calendar',
        desc: 'Schedule house meetings, group sessions, and outings. RSVP tracking and automated reminders built in.',
        accent: '#0369A1',
        accentBg: 'rgba(3,105,161,0.08)',
        accentBorder: 'rgba(3,105,161,0.18)',
        shadow: 'rgba(3,105,161,0.22)',
    },
];

// useSyncExternalStore keeps the media query in sync without synchronous setState in effects
function subscribe(callback: () => void) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
}
function getSnapshot() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function getServerSnapshot() { return false; }

function usePrefersReducedMotion() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function BentoTile({
    tile,
    index,
    reducedMotion,
}: {
    tile: (typeof tiles)[0];
    index: number;
    reducedMotion: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [revealed, setRevealed] = useState(false);
    const [hovered, setHovered] = useState(false);

    // revealed by IntersectionObserver (callback path only — no sync setState)
    useEffect(() => {
        if (reducedMotion) return; // skip — isVisible derives from reducedMotion
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reducedMotion]);

    // When reducedMotion is true, treat everything as already visible
    const isVisible = reducedMotion || revealed;
    const { Icon } = tile;

    return (
        <div
            ref={ref}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="rounded-2xl p-6 cursor-pointer"
            style={{
                background: hovered ? tile.accentBg.replace('0.08', '0.13') : 'rgba(255,255,255,0.05)',
                border: `1px solid ${hovered ? tile.accentBorder.replace('0.18', '0.35') : 'rgba(255,255,255,0.08)'}`,
                boxShadow: hovered ? `0 12px 40px ${tile.shadow}` : '0 2px 12px rgba(0,0,0,0.2)',
                transform: isVisible
                    ? hovered
                        ? 'translateY(-4px) scale(1.025)'
                        : 'translateY(0) scale(1)'
                    : 'translateY(20px) scale(0.98)',
                opacity: isVisible ? 1 : 0,
                transition: reducedMotion
                    ? 'none'
                    : `transform 240ms ease, box-shadow 240ms ease, border-color 200ms ease, opacity 400ms ease ${index * 80}ms, background 200ms ease`,
            }}
        >
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{
                    background: tile.accentBg,
                    boxShadow: hovered
                        ? `0 4px 18px ${tile.shadow}, 0 0 0 3px ${tile.accentBg}`
                        : `0 2px 10px ${tile.shadow.replace('0.22', '0.15')}`,
                    transition: 'box-shadow 220ms ease',
                }}
            >
                <Icon size={18} strokeWidth={2} color={tile.accent} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'white' }}>
                {tile.label}
            </h3>
            <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-noto), sans-serif' }}
            >
                {tile.desc}
            </p>
        </div>
    );
}

export function OperationsSection() {
    const reducedMotion = usePrefersReducedMotion();
    const calloutRef = useRef<HTMLDivElement>(null);
    const [calloutRevealed, setCalloutRevealed] = useState(false);
    const [calloutHovered, setCalloutHovered] = useState(false);

    useEffect(() => {
        if (reducedMotion) return;
        const el = calloutRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setCalloutRevealed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reducedMotion]);

    const calloutVisible = reducedMotion || calloutRevealed;

    return (
        <section
            className="py-24 px-6 relative overflow-hidden"
            style={{
                background: '#0C1A2E',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(8,145,178,0.04) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
            {/* Top separator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(5,150,105,0.3), transparent)' }} />

            <div className="max-w-6xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                        style={{ background: 'rgba(5,150,105,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: '#34D399',
                                animation: reducedMotion ? 'none' : 'ops-pulse 2s ease-in-out infinite',
                            }}
                        />
                        Full Platform Operations
                    </div>
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                        style={{ color: 'white' }}
                    >
                        Run your whole operation
                        <br />
                        <span style={{ color: '#34D399' }}>from one screen.</span>
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-noto), sans-serif' }}
                    >
                        Every operational tool your recovery house needs — unified, mobile-ready, and built for the realities of sober living management.
                    </p>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tiles.map((tile, index) => (
                        <BentoTile
                            key={tile.label}
                            tile={tile}
                            index={index}
                            reducedMotion={reducedMotion}
                        />
                    ))}
                </div>

                {/* Bottom callout */}
                <div
                    ref={calloutRef}
                    onMouseEnter={() => setCalloutHovered(true)}
                    onMouseLeave={() => setCalloutHovered(false)}
                    className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(8,145,178,0.12) 100%)',
                        border: `1px solid ${calloutHovered ? 'rgba(52,211,153,0.4)' : 'rgba(52,211,153,0.18)'}`,
                        boxShadow: calloutHovered
                            ? '0 16px 48px rgba(5,150,105,0.18)'
                            : '0 4px 20px rgba(0,0,0,0.25)',
                        transform: calloutVisible ? 'translateY(0)' : 'translateY(20px)',
                        opacity: calloutVisible ? 1 : 0,
                        transition: reducedMotion
                            ? 'none'
                            : 'transform 420ms ease 480ms, opacity 420ms ease 480ms, border-color 220ms ease, box-shadow 220ms ease',
                    }}
                >
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2" style={{ color: 'white' }}>
                            Everything your staff needs. Nothing they don&apos;t.
                        </h3>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-noto), sans-serif' }}
                        >
                            Role-based access means house managers see what they need, residents see what they need, and administrators see everything — all from the same platform.
                        </p>
                    </div>
                    <a
                        href="#demo"
                        className="px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, #059669, #0891B2)',
                            color: '#fff',
                            boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
                            transition: 'transform 180ms ease, box-shadow 180ms ease',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(5,150,105,0.45)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(5,150,105,0.35)';
                        }}
                    >
                        See It in Action →
                    </a>
                </div>
            </div>

            <style>{`
                @keyframes ops-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }
            `}</style>
        </section>
    );
}
