// app/(dashboard)/[tenantId]/marketing/compose/page.tsx
'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import type { PostType, SocialPlatform, DraftPostResult } from '@/features/marketing/types';
import { ImageUpload } from '@/components/ui/ImageUpload';

const POST_TYPES: { value: PostType; label: string; icon: string; desc: string }[] = [
    { value: 'bed_availability', label: 'Bed Availability', icon: '🛏️', desc: 'Announce open beds at your house' },
    { value: 'success_story', label: 'Success Story', icon: '🌟', desc: 'Share an anonymized resident win' },
    { value: 'event_promo', label: 'Event Promotion', icon: '📅', desc: 'Promote an upcoming event' },
    { value: 'job_listing', label: 'Job Listing', icon: '💼', desc: 'Recruit staff or volunteers' },
    { value: 'general', label: 'General Update', icon: '✍️', desc: 'Anything else on your mind' },
];

const PLATFORMS: { value: SocialPlatform; label: string; color: string }[] = [
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
    { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
    { value: 'tiktok', label: 'TikTok', color: 'bg-gray-900' },
    { value: 'x', label: 'X / Twitter', color: 'bg-gray-800' },
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
];

type Step = 1 | 2 | 3 | 4;

export default function ComposePage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [postType, setPostType] = useState<PostType | null>(null);
    const [contextText, setContextText] = useState('');
    const [tone, setTone] = useState<'professional' | 'warm' | 'urgent' | 'celebratory'>('warm');
    const [imageUrl, setImageUrl] = useState('');

    const [draft, setDraft] = useState('');
    const [aiHashtags, setAiHashtags] = useState<DraftPostResult['hashtags'] | null>(null);
    const [selectedGeneralTags, setSelectedGeneralTags] = useState<string[]>([]);
    const [selectedHouseTags, setSelectedHouseTags] = useState<string[]>([]);
    const [selectedPlatformTags, setSelectedPlatformTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [customTags, setCustomTags] = useState<string[]>([]);

    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
    const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
    const [scheduledAt, setScheduledAt] = useState('');

    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');
    const [publishResult, setPublishResult] = useState<{ platform: string; success: boolean; error?: string }[] | null>(null);

    async function generateDraft() {
        if (!postType) return;
        setGenerating(true);
        setError('');
        try {
            const token = await authService.getIdToken();
            const res = await fetch(`/api/tenants/${tenantId}/marketing/ai-draft`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postType, context: contextText, tone, platform: selectedPlatforms[0] ?? 'facebook' }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data: DraftPostResult = await res.json();
            setDraft(data.draft);
            setAiHashtags(data.hashtags);
            setSelectedGeneralTags(data.hashtags.general.slice(0, 3));
            setSelectedHouseTags([]);
            setSelectedPlatformTags(data.hashtags.platformOptimized.slice(0, 2));
        } catch (e) {
            setError(String(e));
        } finally {
            setGenerating(false);
        }
    }

    async function savePost(asDraft: boolean): Promise<string | null> {
        if (!postType) return null;
        const allHashtags = [...selectedGeneralTags, ...selectedHouseTags, ...selectedPlatformTags, ...customTags];
        const body = {
            content: draft,
            platforms: selectedPlatforms,
            hashtags: allHashtags,
            postType,
            imageUrl: imageUrl || null,
            scheduledAt: !asDraft && scheduleMode === 'schedule' ? scheduledAt : null,
            aiGenerated: !!aiHashtags,
            sourceContext: { contextText, tone },
        };
        const res = await fetch(`/api/tenants/${tenantId}/marketing/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as { post: { id: string } };
        return data.post.id;
    }

    async function submit(asDraft: boolean) {
        setSubmitting(true);
        setError('');
        try {
            await savePost(asDraft);
            router.push(`/${tenantId}/marketing/posts`);
        } catch (e) {
            setError(String(e));
        } finally {
            setSubmitting(false);
        }
    }

    async function publishNow() {
        if (!postType || selectedPlatforms.length === 0) return;
        setPublishing(true);
        setError('');
        setPublishResult(null);
        try {
            // First save the post
            const postId = await savePost(false);
            if (!postId) throw new Error('Failed to save post');

            // Then publish it
            const res = await fetch(`/api/tenants/${tenantId}/marketing/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json() as { results: { platform: string; success: boolean; error?: string }[] };
            setPublishResult(data.results);

            // Redirect after 2s if any success
            if (data.results.some((r) => r.success)) {
                setTimeout(() => router.push(`/${tenantId}/marketing/posts`), 2000);
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setPublishing(false);
        }
    }

    function addCustomTag() {
        const tag = customTagInput.trim().replace(/^#/, '');
        if (tag && !customTags.includes(tag)) {
            setCustomTags(prev => [...prev, tag]);
        }
        setCustomTagInput('');
    }

    function toggleTag(tag: string, selected: string[], setSelected: (t: string[]) => void) {
        setSelected(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
    }

    function togglePlatform(p: SocialPlatform) {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    }

    const stepLabels = ['Post Type', 'Context & Image', 'Edit & Approve', 'Platforms & Timing'];

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {stepLabels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 === step ? 'bg-emerald-600 text-white' : i + 1 < step ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                            {i + 1 < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs hidden sm:inline ${i + 1 === step ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                        {i < stepLabels.length - 1 && <div className="w-4 h-px bg-gray-300 hidden sm:block" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Post Type */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">What type of post?</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {POST_TYPES.map(pt => (
                            <button key={pt.value} onClick={() => setPostType(pt.value)}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${postType === pt.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                <span className="text-2xl">{pt.icon}</span>
                                <div>
                                    <p className={`font-semibold ${postType === pt.value ? 'text-emerald-400' : 'text-white'}`}>{pt.label}</p>
                                    <p className={`text-sm ${postType === pt.value ? 'text-emerald-400/70' : 'text-white/50'}`}>{pt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button disabled={!postType} onClick={() => setStep(2)}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                        Continue →
                    </button>
                </div>
            )}

            {/* Step 2: Context + Image */}
            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Give the AI some context</h2>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Describe what you want to say</label>
                        <textarea value={contextText} onChange={e => setContextText(e.target.value)}
                            rows={5} placeholder={postType === 'bed_availability' ? 'e.g. We have 2 beds open for men in our downtown house, specializing in dual-diagnosis...' : 'Describe the post topic in your own words...'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-400 focus:outline-none scheme-dark" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Tone</label>
                        <div className="flex flex-wrap gap-2">
                            {(['professional', 'warm', 'urgent', 'celebratory'] as const).map(t => (
                                <button key={t} onClick={() => setTone(t)}
                                    className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${tone === t ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                            Post Image <span className="text-white/40 font-normal">(optional — required for Instagram)</span>
                        </label>
                        <ImageUpload
                            storagePath={`tenants/${tenantId}/marketing/posts/${Date.now()}`}
                            onUpload={(url: string) => setImageUrl(url)}
                            currentUrl={imageUrl}
                            accept="image/*"
                        />
                        {imageUrl && (
                            <button
                                onClick={() => setImageUrl('')}
                                className="mt-2 text-xs text-rose-500 hover:underline"
                            >
                                Remove image
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={async () => { await generateDraft(); setStep(3); }} disabled={generating || !contextText.trim()}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                            {generating ? 'Generating...' : '✨ Generate with AI →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Edit & Approve */}
            {step === 3 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Review & edit your post</h2>

                    {/* Image preview */}
                    {imageUrl && (
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="Post image" className="w-full max-h-48 object-cover" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Caption</label>
                        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={7}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-400 focus:outline-none scheme-dark" />
                        <p className="text-xs text-white/40 mt-1">{draft.length} characters</p>
                    </div>

                    {aiHashtags && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-white/80">Hashtags (tap to toggle)</p>
                            {[
                                { label: 'General Recovery', tags: aiHashtags.general, selected: selectedGeneralTags, setSelected: setSelectedGeneralTags },
                                { label: 'House-Specific', tags: aiHashtags.houseSpecific, selected: selectedHouseTags, setSelected: setSelectedHouseTags },
                                { label: 'Platform-Optimized', tags: aiHashtags.platformOptimized, selected: selectedPlatformTags, setSelected: setSelectedPlatformTags },
                            ].map(group => (
                                <div key={group.label}>
                                    <p className="text-xs text-gray-500 mb-1">{group.label}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.tags.map(tag => (
                                            <button key={tag} onClick={() => toggleTag(tag, group.selected, group.setSelected)}
                                                className={`px-2 py-1 rounded-full text-xs transition-colors ${group.selected.includes(tag) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Custom Hashtags</p>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {customTags.map(tag => (
                                        <span key={tag} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 flex items-center gap-1">
                                            #{tag}
                                            <button onClick={() => setCustomTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input value={customTagInput} onChange={e => setCustomTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                                        placeholder="Add custom tag" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                                    <button onClick={addCustomTag} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Add</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={() => setStep(4)} disabled={!draft.trim()}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                            Choose Platforms →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Platforms & Timing */}
            {step === 4 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Where & when?</h2>
                    <div>
                        <p className="text-sm font-medium text-white/80 mb-2">Platforms</p>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(p => (
                                <button key={p.value} onClick={() => togglePlatform(p.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPlatforms.includes(p.value) ? `${p.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {selectedPlatforms.includes('instagram') && !imageUrl && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                ⚠️ Instagram requires an image. Go back to Step 2 to add one.
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/80 mb-2">Timing</p>
                        <div className="flex gap-3">
                            {(['now', 'schedule'] as const).map(mode => (
                                <button key={mode} onClick={() => setScheduleMode(mode)}
                                    className={`px-4 py-2 rounded-lg text-sm capitalize border-2 transition-colors ${scheduleMode === mode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                                    {mode === 'now' ? 'Publish Now' : 'Schedule'}
                                </button>
                            ))}
                        </div>
                        {scheduleMode === 'schedule' && (
                            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                                className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        )}
                    </div>

                    {/* Publish result feedback */}
                    {publishResult && (
                        <div className="space-y-2">
                            {publishResult.map((r) => (
                                <div key={r.platform}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${r.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                    <span>{r.success ? '✓' : '✗'}</span>
                                    <span className="capitalize font-medium">{r.platform}</span>
                                    {!r.success && r.error && <span className="text-xs opacity-75">— {r.error}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setStep(3)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">← Back</button>
                        <button onClick={() => submit(true)} disabled={submitting || publishing}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                            Save Draft
                        </button>
                        {scheduleMode === 'schedule' ? (
                            <button onClick={() => submit(false)} disabled={submitting || selectedPlatforms.length === 0 || !scheduledAt}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                                {submitting ? 'Scheduling...' : '📅 Schedule Post'}
                            </button>
                        ) : (
                            <button onClick={publishNow} disabled={publishing || submitting || selectedPlatforms.length === 0}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors">
                                {publishing ? 'Publishing...' : '🚀 Publish Now'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
