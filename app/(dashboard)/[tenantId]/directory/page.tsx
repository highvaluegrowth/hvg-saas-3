'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface DirectoryProfile {
  listed: boolean; bio: string; logoUrl: string; website: string;
  specializations: string[]; amenities: string[]; acceptedFunding: string[];
}

interface Promo {
  id: string; title: string; description: string; partnerName: string;
  discountText: string; expiresAt?: string | null; active: boolean;
}

interface PromoForm {
  title: string; description: string; partnerName: string; discountText: string; expiresAt: string;
}

const EMPTY_PROMO_FORM: PromoForm = { title: '', description: '', partnerName: '', discountText: '', expiresAt: '' };

const SPECIALIZATION_OPTIONS = [
  { label: 'Faith-Based', value: 'faith-based' }, { label: 'LGBTQ+ Affirming', value: 'LGBTQ+ affirming' },
  { label: 'Veteran-Focused', value: 'veteran-focused' }, { label: 'MAT-Friendly', value: 'MAT-friendly' },
  { label: 'Women Only', value: 'women-only' }, { label: 'Men Only', value: 'men-only' },
];
const AMENITY_OPTIONS = [
  { label: 'WiFi', value: 'WiFi' }, { label: 'Laundry', value: 'Laundry' },
  { label: 'Transportation', value: 'Transportation' }, { label: 'Gym', value: 'Gym' },
];
const FUNDING_OPTIONS = [
  { label: 'Medicaid', value: 'Medicaid' }, { label: 'Medicare', value: 'Medicare' },
  { label: 'Private Insurance', value: 'Private Insurance' }, { label: 'VA', value: 'VA' },
  { label: 'SOR', value: 'SOR' }, { label: 'Self-Pay', value: 'Self-Pay' },
];

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none";
const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' };

export default function DirectoryPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  const [profile, setProfile] = useState<DirectoryProfile>({ listed: false, bio: '', logoUrl: '', website: '', specializations: [], amenities: [], acceptedFunding: [] });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [promos, setPromos] = useState<Promo[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO_FORM);
  const [promoAdding, setPromoAdding] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProfile(data.profile); }
    } catch { /* fail silently */ }
    finally { setProfileLoading(false); }
  }, [tenantId]);

  const loadPromos = useCallback(async () => {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory/promos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setPromos(data.promos ?? []); }
    } catch { /* fail silently */ }
    finally { setPromosLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadProfile(); loadPromos(); }, [loadProfile, loadPromos]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setProfileSaving(true); setProfileError(''); setProfileSaved(false);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
      });
      if (!res.ok) { const data = await res.json(); setProfileError(data.error ?? 'Failed to save'); }
      else { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
    } catch { setProfileError('Network error — please try again'); }
    finally { setProfileSaving(false); }
  }

  async function handleAddPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoForm.title.trim() || !promoForm.description.trim() || !promoForm.partnerName.trim() || !promoForm.discountText.trim()) {
      setPromoError('All fields except expiry are required'); return;
    }
    setPromoAdding(true); setPromoError('');
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/directory/promos`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...promoForm, expiresAt: promoForm.expiresAt || null, active: true }),
      });
      if (!res.ok) { const data = await res.json(); setPromoError(data.error ?? 'Failed to add promo'); }
      else { setPromoForm(EMPTY_PROMO_FORM); setShowPromoForm(false); await loadPromos(); }
    } catch { setPromoError('Network error — please try again'); }
    finally { setPromoAdding(false); }
  }

  async function handleDeletePromo(promoId: string) {
    if (!confirm('Delete this promo?')) return;
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/directory/promos?id=${promoId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setPromos(prev => prev.filter(p => p.id !== promoId));
    } catch { /* fail silently */ }
  }

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
  const cardHeaderStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };

  function CheckboxGroup({ options, selected, onChange, checkedBg }: { options: { label: string; value: string }[]; selected: string[]; onChange: (v: string) => void; checkedBg: string }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(opt => {
          const checked = selected.includes(opt.value);
          return (
            <label key={opt.value} className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm"
              style={checked ? { background: `${checkedBg}20`, border: `1px solid ${checkedBg}50`, color: 'white' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <input type="checkbox" checked={checked} onChange={() => onChange(opt.value)} className="sr-only" />
              <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                style={checked ? { background: checkedBg, borderColor: checkedBg } : { borderColor: 'rgba(255,255,255,0.2)' }}>
                {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
              </span>
              {opt.label}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Directory Listing</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Control how your organization appears in the public HVG sober living directory.</p>
      </div>

      {/* Profile section */}
      <section className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-5" style={cardHeaderStyle}>
          <h2 className="text-lg font-semibold text-white">Organization Profile</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>This information will be shown publicly when your listing is active.</p>
        </div>
        {profileLoading ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading profile…</div>
        ) : (
          <form onSubmit={handleSaveProfile} className="px-6 py-6 space-y-6">
            {/* Listed toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p className="font-medium text-sm text-white">List my organization in the directory</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>When enabled, your profile will be publicly visible at /directory.</p>
              </div>
              <button type="button" onClick={() => setProfile(p => ({ ...p, listed: !p.listed }))}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                style={{ background: profile.listed ? '#0891B2' : 'rgba(255,255,255,0.15)' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profile.listed ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>About your organization</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={4}
                placeholder="Describe your sober living home, mission, and approach to recovery..." className={inputCls} style={inputStyle} />
            </div>

            {/* Logo + Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Organisation Logo</label>
                <ImageUpload storagePath={`tenants/${tenantId}/logo`} onUpload={url => setProfile(p => ({ ...p, logoUrl: url }))} currentUrl={profile.logoUrl || undefined} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Website</label>
                <input type="url" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://yourhouse.com" className={`${inputCls} resize-none`} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Specializations</label>
              <CheckboxGroup options={SPECIALIZATION_OPTIONS} selected={profile.specializations} onChange={v => setProfile(p => ({ ...p, specializations: toggle(p.specializations, v) }))} checkedBg="#0891B2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Amenities</label>
              <CheckboxGroup options={AMENITY_OPTIONS} selected={profile.amenities} onChange={v => setProfile(p => ({ ...p, amenities: toggle(p.amenities, v) }))} checkedBg="#059669" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>Accepted Funding</label>
              <CheckboxGroup options={FUNDING_OPTIONS} selected={profile.acceptedFunding} onChange={v => setProfile(p => ({ ...p, acceptedFunding: toggle(p.acceptedFunding, v) }))} checkedBg="#D97706" />
            </div>

            {profileError && <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{profileError}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
                {profileSaving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>) : 'Save Profile'}
              </button>
              {profileSaved && <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#6EE7B7' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>Saved
              </span>}
            </div>
          </form>
        )}
      </section>

      {/* Promos section */}
      <section className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-5 flex items-center justify-between" style={cardHeaderStyle}>
          <div>
            <h2 className="text-lg font-semibold text-white">Partner Promos</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Discounts and perks shown on your public directory profile.</p>
          </div>
          <button type="button" onClick={() => { setShowPromoForm(v => !v); setPromoError(''); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Promo
          </button>
        </div>

        {showPromoForm && (
          <form onSubmit={handleAddPromo} className="px-6 py-5 space-y-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-sm font-semibold text-white">New Promo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ l: 'Title', f: 'title', p: 'e.g. Gym Membership Discount' }, { l: 'Partner Name', f: 'partnerName', p: 'e.g. Planet Fitness' }, { l: 'Discount Text', f: 'discountText', p: 'e.g. 20% off first month' }].map(({ l, f, p }) => (
                <div key={f}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{l}</label>
                  <input type="text" value={promoForm[f as keyof PromoForm]} onChange={e => setPromoForm(x => ({ ...x, [f]: e.target.value }))}
                    placeholder={p} className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500" style={inputStyle} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Expiry Date (optional)</label>
                <input type="date" value={promoForm.expiresAt} onChange={e => setPromoForm(x => ({ ...x, expiresAt: e.target.value }))}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Description</label>
              <textarea value={promoForm.description} onChange={e => setPromoForm(x => ({ ...x, description: e.target.value }))} rows={2}
                placeholder="Brief details about this offer..." className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" style={inputStyle} />
            </div>
            {promoError && <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{promoError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={promoAdding} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>{promoAdding ? 'Adding…' : 'Add Promo'}</button>
              <button type="button" onClick={() => { setShowPromoForm(false); setPromoForm(EMPTY_PROMO_FORM); setPromoError(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
            </div>
          </form>
        )}

        {promosLoading ? (
          <div className="px-6 py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading promos…</div>
        ) : promos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No active promos yet. Add one to attract residents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Promo', 'Partner', 'Discount', 'Expires', ''].map(h => (
                    <th key={h} className={`text-left text-xs font-semibold uppercase tracking-wider px-${h === '' ? 4 : h === 'Promo' ? 6 : 4} py-3`} style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {promos.map(promo => (
                  <tr key={promo.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{promo.title}</p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{promo.description}</p>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{promo.partnerName}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: 'rgba(245,158,11,0.2)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {promo.discountText}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" onClick={() => handleDeletePromo(promo.id)} title="Delete promo"
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'rgba(255,255,255,0.3)' }}>
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

      {profile.listed && (
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your public directory profile is visible at{' '}
          <a href={`/directory/${tenantId}`} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#67E8F9' }}>/directory/{tenantId}</a>
        </p>
      )}
    </div>
  );
}
