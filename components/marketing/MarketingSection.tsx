'use client';

import { useEffect, useRef, useState, useSyncExternalStore, useCallback } from 'react';
import {
    PenLine,
    CalendarDays,
    BarChart2,
    Crosshair,
    Zap,
    ImageIcon,
} from 'lucide-react';

const platforms = [
    { name: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.15)' },
    { name: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.15)' },
    { name: 'TikTok', color: '#69C9D0', bg: 'rgba(105,201,208,0.15)' },
    { name: 'X / Twitter', color: '#fff', bg: 'rgba(255,255,255,0.1)' },
    { name: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.15)' },
];

const features = [
    {
        Icon: PenLine,
        title: 'AI Post Drafting',
        desc: 'Describe what you want to share. The AI writes scroll-stopping posts in your brand voice — instantly.',
    },
    {
        Icon: CalendarDays,
        title: 'Multi-Platform Scheduler',
        desc: 'Queue posts for Facebook, Instagram, TikTok, X, and LinkedIn from one calendar. Set it and forget it.',
    },
    {
        Icon: BarChart2,
        title: 'Performance Analytics',
        desc: 'See reach, engagement, and follower growth across all platforms in a single unified dashboard.',
    },
    {
        Icon: Crosshair,
        title: 'Brand Voice AI',
        desc: "Train the AI on your organization's tone — compassionate, professional, faith-based, or community-focused.",
    },
    {
        Icon: Zap,
        title: 'Auto-Posting Cron',
        desc: "Scheduled posts fire automatically, even while you're doing intake or running a house meeting.",
    },
    {
        Icon: ImageIcon,
        title: 'Image & Media Support',
        desc: "Upload photos, attach to posts, and preview how they'll look on each platform before publishing.",
    },
];

const workflowSteps = [
    { step: '1', label: 'Describe your post', sub: '"Celebrate 30 days sober, recovery is possible"' },
    { step: '2', label: 'AI drafts content', sub: 'Tailored copy for each platform' },
    { step: '3', label: 'Pick platforms & time', sub: 'Schedule or publish now' },
    { step: '4', label: 'Track performance', sub: 'Views, likes, follows in one dashboard' },
];

// useSyncExternalStore avoids synchronous setState in effects
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

function FeatureCard({
    feature,
    index,
    reducedMotion,
}: {
    feature: (typeof features)[0];
    index: number;
    reducedMotion: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [revealed, setRevealed] = useState(false);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (reducedMotion) return;
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reducedMotion]);

    const isVisible = reducedMotion || revealed;
    const { Icon } = feature;

    return (
        <div
            ref={ref}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="rounded-2xl p-6 cursor-pointer"
            style={{
                background: hovered ? 'rgba(99,102,241,0.09)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovered ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: hovered ? '0 8px 32px rgba(99,102,241,0.16)' : 'none',
                transform: isVisible
                    ? hovered
                        ? 'translateY(-4px) scale(1.025)'
                        : 'translateY(0) scale(1)'
                    : 'translateY(22px) scale(0.97)',
                opacity: isVisible ? 1 : 0,
                transition: reducedMotion
                    ? 'none'
                    : `transform 240ms ease, box-shadow 240ms ease, border-color 200ms ease, background 200ms ease, opacity 400ms ease ${index * 90}ms`,
            }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                    background: hovered ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)',
                    boxShadow: hovered ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    transition: 'background 200ms ease, box-shadow 200ms ease',
                }}
            >
                <Icon size={18} strokeWidth={2} color={hovered ? '#a5b4fc' : '#818cf8'} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: '#f1f5f9' }}>
                {feature.title}
            </h3>
            <p
                className="text-sm leading-relaxed"
                style={{ color: '#64748b', fontFamily: 'var(--font-noto), sans-serif' }}
            >
                {feature.desc}
            </p>
        </div>
    );
}

export function MarketingSection() {
    const reducedMotion = usePrefersReducedMotion();
    const [activeStep, setActiveStep] = useState(0);
    const [diagramHovered, setDiagramHovered] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCycle = useCallback(() => {
        if (reducedMotion) return;
        intervalRef.current = setInterval(() => {
            setActiveStep(prev => (prev + 1) % workflowSteps.length);
        }, 3500);
    }, [reducedMotion]);

    useEffect(() => {
        startCycle();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startCycle]);

    const handleDiagramEnter = () => {
        setDiagramHovered(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleDiagramLeave = () => {
        setDiagramHovered(false);
        startCycle();
    };

    return (
        <section
            className="py-24 px-6 relative overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1630 100%)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            {/* Background depth blobs */}
            <div
                className="pointer-events-none absolute"
                style={{
                    top: '-160px',
                    right: '-120px',
                    width: '520px',
                    height: '520px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
                }}
            />
            <div
                className="pointer-events-none absolute"
                style={{
                    bottom: '-100px',
                    left: '-80px',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)',
                }}
            />

            <div className="max-w-6xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-16">
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        style={{
                            background: 'rgba(99,102,241,0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99,102,241,0.3)',
                        }}
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
                        {platforms.map(p => (
                            <span
                                key={p.name}
                                className="px-4 py-1.5 rounded-full text-sm font-semibold cursor-default"
                                style={{
                                    background: p.bg,
                                    color: p.color,
                                    border: `1px solid ${p.color}30`,
                                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${p.color}25`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                            >
                                {p.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <FeatureCard
                            key={f.title}
                            feature={f}
                            index={i}
                            reducedMotion={reducedMotion}
                        />
                    ))}
                </div>

                {/* Workflow diagram */}
                <div
                    onMouseEnter={handleDiagramEnter}
                    onMouseLeave={handleDiagramLeave}
                    className="mt-12 rounded-2xl p-6 md:p-8"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${diagramHovered ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.2)'}`,
                        transition: 'border-color 220ms ease',
                    }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{
                                background: '#22C55E',
                                animation: reducedMotion ? 'none' : 'mkt-live-pulse 2s ease-in-out infinite',
                            }}
                        />
                        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#6366f1' }}>
                            Live workflow
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch gap-3 text-center md:text-left">
                        {workflowSteps.map((item, i) => {
                            const isActive = activeStep === i;
                            return (
                                <div key={i} className="flex md:contents items-center gap-3">
                                    <div
                                        className="flex-1 rounded-xl p-4 cursor-default"
                                        style={{
                                            background: isActive
                                                ? 'rgba(99,102,241,0.16)'
                                                : 'rgba(99,102,241,0.06)',
                                            border: `1px solid ${isActive ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.12)'}`,
                                            boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.18)' : 'none',
                                            transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                            transition: reducedMotion
                                                ? 'none'
                                                : 'transform 320ms ease, background 320ms ease, border-color 320ms ease, box-shadow 320ms ease',
                                        }}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto md:mx-0 mb-2"
                                            style={{
                                                background: isActive ? '#818cf8' : '#6366f1',
                                                color: '#fff',
                                                boxShadow: isActive ? '0 0 12px rgba(129,140,248,0.5)' : 'none',
                                                transition: reducedMotion ? 'none' : 'background 320ms ease, box-shadow 320ms ease',
                                            }}
                                        >
                                            {item.step}
                                        </div>
                                        <p
                                            className="text-sm font-semibold mb-1"
                                            style={{ color: isActive ? '#e2e8f0' : '#94a3b8', transition: 'color 320ms ease' }}
                                        >
                                            {item.label}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: isActive ? '#94a3b8' : '#475569',
                                                fontFamily: 'var(--font-noto), sans-serif',
                                                transition: 'color 320ms ease',
                                            }}
                                        >
                                            {item.sub}
                                        </p>
                                    </div>
                                    {i < workflowSteps.length - 1 && (
                                        <div
                                            className="hidden md:flex items-center justify-center text-xl flex-shrink-0"
                                            style={{
                                                color: activeStep === i ? '#6366f1' : '#334155',
                                                transition: reducedMotion ? 'none' : 'color 320ms ease',
                                            }}
                                        >
                                            →
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes mkt-live-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
            `}</style>
        </section>
    );
}
