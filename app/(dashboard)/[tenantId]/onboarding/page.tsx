'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';

type Params = Promise<{ tenantId: string }>;

// ─── Types ─────────────────────────────────────────────────────────────────

interface HouseFormData {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    capacity: string;
}

// ─── Step indicator ─────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Your House' },
    { label: 'Social Media' },
    { label: 'Courses' },
    { label: 'Staff' },
    { label: 'All Done!' },
];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((step, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                i < current
                                    ? 'bg-emerald-500 text-white'
                                    : i === current
                                    ? 'bg-cyan-600 text-white ring-4 ring-cyan-100'
                                    : 'bg-gray-200 text-gray-400'
                            }`}
                        >
                            {i < current ? '✓' : i + 1}
                        </div>
                        <span
                            className={`mt-1 text-xs font-medium whitespace-nowrap hidden sm:block ${
                                i === current ? 'text-cyan-700' : i < current ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div
                            className={`w-12 sm:w-16 h-0.5 mx-1 transition-colors ${
                                i < current ? 'bg-emerald-400' : 'bg-gray-200'
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 1: House Details ───────────────────────────────────────────────────

function Step1House({
    tenantId,
    onNext,
}: {
    tenantId: string;
    onNext: () => void;
}) {
    const [form, setForm] = useState<HouseFormData>({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        capacity: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof HouseFormData, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const isValid =
        form.name.trim() &&
        form.street.trim() &&
        form.city.trim() &&
        form.state.trim().length >= 2 &&
        form.zip.trim().length >= 5 &&
        Number(form.capacity) >= 1;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSaving(true);
        setError(null);
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/tenants/${tenantId}/houses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    address: {
                        street: form.street.trim(),
                        city: form.city.trim(),
                        state: form.state.trim().toUpperCase(),
                        zip: form.zip.trim(),
                    },
                    capacity: parseInt(form.capacity, 10),
                    status: 'active',
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? 'Failed to create house');
            }
            onNext();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Set up your first house</h2>
            <p className="text-sm text-gray-500 mb-6">
                Create a house record so you can start adding residents, staff, and events.
            </p>

            <div className="space-y-4">
                <div>
                    <label className={labelClass}>House Name *</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., Recovery House - Main St"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Street Address *</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="123 Main Street"
                        value={form.street}
                        onChange={e => set('street', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2">
                        <label className={labelClass}>City *</label>
                        <input
                            type="text"
                            className={inputClass}
                            placeholder="Springfield"
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>State *</label>
                        <input
                            type="text"
                            className={inputClass}
                            placeholder="MO"
                            maxLength={2}
                            value={form.state}
                            onChange={e => set('state', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>ZIP *</label>
                        <input
                            type="text"
                            className={inputClass}
                            placeholder="65801"
                            maxLength={10}
                            value={form.zip}
                            onChange={e => set('zip', e.target.value)}
                        />
                    </div>
                </div>

                <div className="max-w-xs">
                    <label className={labelClass}>Total Bed Capacity *</label>
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="12"
                        min="1"
                        max="200"
                        value={form.capacity}
                        onChange={e => set('capacity', e.target.value)}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || saving}
                        className="px-6 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {saving ? 'Creating house…' : 'Create House & Continue →'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Skippable step wrapper ──────────────────────────────────────────────────

function SkippableStep({
    title,
    description,
    icon,
    ctaLabel,
    ctaHref,
    onSkip,
    onNext,
    nextLabel = 'Continue →',
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    ctaLabel: string;
    ctaHref: string;
    onSkip: () => void;
    onNext: () => void;
    nextLabel?: string;
}) {
    return (
        <div>
            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0 text-cyan-600">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <a
                    href={ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                >
                    {ctaLabel}
                </a>
                <button
                    onClick={onNext}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                    {nextLabel}
                </button>
                <button
                    onClick={onSkip}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline ml-auto"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}

// ─── Step 2: Social Media ────────────────────────────────────────────────────

function Step2Social({ tenantId, onNext }: { tenantId: string; onNext: () => void }) {
    return (
        <SkippableStep
            title="Connect your social accounts"
            description="Post content to Facebook, Instagram, TikTok, and more directly from HVG. Schedule posts, track engagement, and grow your community — all in one place."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            }
            ctaLabel="Go to Marketing Suite →"
            ctaHref={`/${tenantId}/marketing`}
            onSkip={onNext}
            onNext={onNext}
            nextLabel="Continue →"
        />
    );
}

// ─── Step 3: Courses ─────────────────────────────────────────────────────────

function Step3Courses({ tenantId, onNext }: { tenantId: string; onNext: () => void }) {
    return (
        <SkippableStep
            title="Create a training course"
            description="Build self-paced courses for your residents. Add video lessons, text content, and quizzes. Track who's completed what and reward progress."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            }
            ctaLabel="Open Course Builder →"
            ctaHref={`/${tenantId}/lms`}
            onSkip={onNext}
            onNext={onNext}
            nextLabel="Continue →"
        />
    );
}

// ─── Step 4: Staff ───────────────────────────────────────────────────────────

function Step4Staff({ tenantId, onNext }: { tenantId: string; onNext: () => void }) {
    return (
        <SkippableStep
            title="Add your team"
            description="Invite house managers and staff members. Assign roles, manage chores, incidents, and daily house operations together from a shared dashboard."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            }
            ctaLabel="Manage Staff →"
            ctaHref={`/${tenantId}/staff`}
            onSkip={onNext}
            onNext={onNext}
            nextLabel="Continue →"
        />
    );
}

// ─── Step 5: Done ────────────────────────────────────────────────────────────

function Step5Done({ tenantId }: { tenantId: string }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const handleFinish = async () => {
        setSaving(true);
        // Set localStorage bypass BEFORE navigating so the layout gate never re-fires,
        // even if the API call below fails for any reason.
        localStorage.setItem(`hvg_ob_${tenantId}`, '1');
        try {
            const token = await authService.getIdToken();
            await fetch(`/api/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ onboardingComplete: true }),
            });
        } catch {
            // Non-critical — localStorage bypass already set above
        } finally {
            router.push(`/${tenantId}`);
        }
    };

    return (
        <div className="text-center py-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Your platform is configured and ready to go. You can always update settings,
                add more houses, and configure integrations from the sidebar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8 max-w-xl mx-auto">
                {[
                    { icon: '🏠', title: 'Add residents', desc: 'Enroll residents in your house' },
                    { icon: '📅', title: 'Schedule events', desc: 'Set up meetings and activities' },
                    { icon: '🤖', title: 'AI assistant', desc: 'Ask HVG Partner anything' },
                ].map(item => (
                    <div key={item.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                ))}
            </div>

            <button
                onClick={handleFinish}
                disabled={saving}
                className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-60 text-sm"
            >
                {saving ? 'Loading dashboard…' : 'Go to Dashboard →'}
            </button>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function OnboardingPage({ params }: { params: Params }) {
    const { tenantId } = use(params);
    const [step, setStep] = useState(0);

    const next = () => setStep(s => s + 1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-start justify-center p-4 pt-12">
            <div className="w-full max-w-2xl">
                {/* Logo / brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-gray-900">HVG Platform</span>
                    </div>
                    <p className="text-sm text-gray-500">Let&apos;s get your house ready in a few quick steps</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <StepIndicator current={step} />

                    {step === 0 && <Step1House tenantId={tenantId} onNext={next} />}
                    {step === 1 && <Step2Social tenantId={tenantId} onNext={next} />}
                    {step === 2 && <Step3Courses tenantId={tenantId} onNext={next} />}
                    {step === 3 && <Step4Staff tenantId={tenantId} onNext={next} />}
                    {step === 4 && <Step5Done tenantId={tenantId} />}
                </div>

                {/* Footer note */}
                {step < 4 && (
                    <p className="text-center text-xs text-gray-400 mt-4">
                        You can always skip optional steps and return to them later from the sidebar.
                    </p>
                )}
            </div>
        </div>
    );
}
