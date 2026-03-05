'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { ImageUpload } from '@/components/ui/ImageUpload';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DirectoryProfile {
  listed: boolean;
  bio: string;
  logoUrl: string;
  website: string;
  specializations: string[];
  amenities: string[];
  acceptedFunding: string[];
}

interface Promo {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  discountText: string;
  expiresAt?: string | null;
  active: boolean;
}

interface PromoForm {
  title: string;
  description: string;
  partnerName: string;
  discountText: string;
  expiresAt: string;
}

const EMPTY_PROMO_FORM: PromoForm = {
  title: '',
  description: '',
  partnerName: '',
  discountText: '',
  expiresAt: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SPECIALIZATION_OPTIONS = [
  { label: 'Faith-Based', value: 'faith-based' },
  { label: 'LGBTQ+ Affirming', value: 'LGBTQ+ affirming' },
  { label: 'Veteran-Focused', value: 'veteran-focused' },
  { label: 'MAT-Friendly', value: 'MAT-friendly' },
  { label: 'Women Only', value: 'women-only' },
  { label: 'Men Only', value: 'men-only' },
];

const AMENITY_OPTIONS = [
  { label: 'WiFi', value: 'WiFi' },
  { label: 'Laundry', value: 'Laundry' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Gym', value: 'Gym' },
];

const FUNDING_OPTIONS = [
  { label: 'Medicaid', value: 'Medicaid' },
  { label: 'Medicare', value: 'Medicare' },
  { label: 'Private Insurance', value: 'Private Insurance' },
  { label: 'VA', value: 'VA' },
  { label: 'SOR', value: 'SOR' },
  { label: 'Self-Pay', value: 'Self-Pay' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DirectoryPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  // Profile state
  const [profile, setProfile] = useState<DirectoryProfile>({
    listed: false,
    bio: '',
    logoUrl: '',
    website: '',
    specializations: [],
    amenities: [],
    acceptedFunding: [],
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Promos state
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO_FORM);
  const [promoAdding, setPromoAdding] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);

  // ── Load profile ────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {
      // fail silently — user sees empty form
    } finally {
      setProfileLoading(false);
    }
  }, [tenantId]);

  // ── Load promos ─────────────────────────────────────────────────────────
  const loadPromos = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory/promos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(data.promos ?? []);
      }
    } catch {
      // fail silently
    } finally {
      setPromosLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProfile();
    loadPromos();
  }, [loadProfile, loadPromos]);

  // ── Save profile ────────────────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json();
        setProfileError(data.error ?? 'Failed to save profile');
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      setProfileError('Network error — please try again');
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Add promo ───────────────────────────────────────────────────────────
  async function handleAddPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoForm.title.trim() || !promoForm.description.trim() || !promoForm.partnerName.trim() || !promoForm.discountText.trim()) {
      setPromoError('All fields except expiry are required');
      return;
    }
    setPromoAdding(true);
    setPromoError('');
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory/promos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...promoForm,
          expiresAt: promoForm.expiresAt || null,
          active: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPromoError(data.error ?? 'Failed to add promo');
      } else {
        setPromoForm(EMPTY_PROMO_FORM);
        setShowPromoForm(false);
        await loadPromos();
      }
    } catch {
      setPromoError('Network error — please try again');
    } finally {
      setPromoAdding(false);
    }
  }

  // ── Delete promo ────────────────────────────────────────────────────────
  async function handleDeletePromo(promoId: string) {
    if (!confirm('Delete this promo?')) return;
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/directory/promos?id=${promoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromos((prev) => prev.filter((p) => p.id !== promoId));
    } catch {
      // fail silently
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Directory Listing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control how your organization appears in the public HVG sober living directory.
        </p>
      </div>

      {/* ── Profile section ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Organization Profile</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            This information will be shown publicly when your listing is active.
          </p>
        </div>

        {profileLoading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading profile…</div>
        ) : (
          <form onSubmit={handleSaveProfile} className="px-6 py-6 space-y-6">
            {/* Listed toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900 text-sm">List my organization in the directory</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  When enabled, your profile will be publicly visible at /directory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, listed: !p.listed }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  profile.listed ? 'bg-cyan-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    profile.listed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                About your organization
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={4}
                placeholder="Describe your sober living home, mission, and approach to recovery..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Logo URL + Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation Logo</label>
                <ImageUpload
                  storagePath={`tenants/${tenantId}/logo`}
                  onUpload={(url) => setProfile((p) => ({ ...p, logoUrl: url }))}
                  currentUrl={profile.logoUrl || undefined}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://yourhouse.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALIZATION_OPTIONS.map((opt) => {
                  const checked = profile.specializations.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setProfile((p) => ({ ...p, specializations: toggle(p.specializations, opt.value) }))}
                        className="sr-only"
                      />
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                          checked ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AMENITY_OPTIONS.map((opt) => {
                  const checked = profile.amenities.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setProfile((p) => ({ ...p, amenities: toggle(p.amenities, opt.value) }))}
                        className="sr-only"
                      />
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                          checked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Accepted funding */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Funding</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FUNDING_OPTIONS.map((opt) => {
                  const checked = profile.acceptedFunding.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setProfile((p) => ({ ...p, acceptedFunding: toggle(p.acceptedFunding, opt.value) }))}
                        className="sr-only"
                      />
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                          checked ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Error / save feedback */}
            {profileError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{profileError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
              >
                {profileSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
              {profileSaved && (
                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Saved
                </span>
              )}
            </div>
          </form>
        )}
      </section>

      {/* ── Promos section ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Partner Promos</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Discounts and perks shown on your public directory profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowPromoForm((v) => !v); setPromoError(''); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Promo
          </button>
        </div>

        {/* Add promo form */}
        {showPromoForm && (
          <form onSubmit={handleAddPromo} className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">New Promo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Gym Membership Discount"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Partner Name</label>
                <input
                  type="text"
                  value={promoForm.partnerName}
                  onChange={(e) => setPromoForm((f) => ({ ...f, partnerName: e.target.value }))}
                  placeholder="e.g. Planet Fitness"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount Text</label>
                <input
                  type="text"
                  value={promoForm.discountText}
                  onChange={(e) => setPromoForm((f) => ({ ...f, discountText: e.target.value }))}
                  placeholder="e.g. 20% off first month"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={promoForm.expiresAt}
                  onChange={(e) => setPromoForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={promoForm.description}
                onChange={(e) => setPromoForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief details about this offer..."
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>
            {promoError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{promoError}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={promoAdding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
              >
                {promoAdding ? 'Adding…' : 'Add Promo'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPromoForm(false); setPromoForm(EMPTY_PROMO_FORM); setPromoError(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Promos table */}
        {promosLoading ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Loading promos…</div>
        ) : promos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No active promos yet. Add one to attract residents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Promo</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Partner</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Discount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{promo.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{promo.description}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{promo.partnerName}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                        {promo.discountText}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {promo.expiresAt
                        ? new Date(promo.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete promo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Public link hint */}
      {profile.listed && (
        <p className="text-xs text-gray-500 text-center">
          Your public directory profile is visible at{' '}
          <a href={`/directory/${tenantId}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
            /directory/{tenantId}
          </a>
        </p>
      )}
    </div>
  );
}
