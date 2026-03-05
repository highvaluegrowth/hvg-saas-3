import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tenantId: string }>;

interface Promo {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  discountText: string;
  expiresAt?: string | null;
  active: boolean;
}

interface TenantProfile {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string;
  logoURL: string;
  specializations: string[];
  amenities: string[];
  acceptedFunding: string[];
  website: string;
  listed: boolean;
}

async function getTenantProfile(tenantId: string): Promise<TenantProfile | null> {
  const doc = await adminDb.collection('tenants').doc(tenantId).get();
  if (!doc.exists) return null;

  const data = doc.data() ?? {};
  const dir = data.directory ?? {};

  // Only show if listed
  if (!dir.listed) return null;

  return {
    id: doc.id,
    name: data.name ?? '',
    city: data.city ?? dir.city ?? '',
    state: data.state ?? dir.state ?? '',
    description: dir.bio ?? data.description ?? '',
    logoURL: dir.logoUrl ?? data.logoURL ?? '',
    specializations: dir.specializations ?? [],
    amenities: dir.amenities ?? [],
    acceptedFunding: dir.acceptedFunding ?? [],
    website: dir.website ?? '',
    listed: dir.listed ?? false,
  };
}

async function getActivePromos(tenantId: string): Promise<Promo[]> {
  const snapshot = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('promos')
    .where('active', '==', true)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Promo[];
}

function AmenityIcon({ amenity }: { amenity: string }) {
  const icons: Record<string, React.ReactNode> = {
    WiFi: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
      </svg>
    ),
    Laundry: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-9 5.25-9-5.25v-2.25" />
      </svg>
    ),
    Transportation: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    Gym: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  };
  return <>{icons[amenity] ?? null}</>;
}

export default async function TenantDirectoryPage({ params }: { params: Params }) {
  const { tenantId } = await params;

  const [profile, promos] = await Promise.all([
    getTenantProfile(tenantId),
    getActivePromos(tenantId),
  ]);

  if (!profile) notFound();

  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <main style={{ fontFamily: 'var(--font-figtree), sans-serif' }}>
      <MarketingNavbar />

      <div className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Directory
          </Link>

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            {/* Header gradient band */}
            <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #0891B2 0%, #059669 100%)' }} />

            <div className="px-8 pb-8">
              {/* Logo / avatar overlapping the band */}
              <div className="-mt-12 mb-5">
                {profile.logoURL ? (
                  <img
                    src={profile.logoURL}
                    alt={`${profile.name} logo`}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
                  >
                    {initials || '?'}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  {(profile.city || profile.state) && (
                    <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {[profile.city, profile.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-600 hover:text-cyan-700 mt-1 inline-flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                <Link
                  href={`/apply/bed?tenantId=${profile.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
                >
                  Apply for a Bed
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

              {/* Description */}
              {profile.description && (
                <p className="mt-6 text-gray-600 leading-relaxed">{profile.description}</p>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Specializations */}
            {profile.specializations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-50 text-cyan-700 border border-cyan-100"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {profile.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Amenities</h2>
                <ul className="space-y-2">
                  {profile.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-emerald-600">
                        <AmenityIcon amenity={amenity} />
                      </span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Accepted funding */}
            {profile.acceptedFunding.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accepted Funding</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.acceptedFunding.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Partner Promos */}
          {promos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Resident Perks &amp; Discounts</h2>
                <p className="text-sm text-gray-500 mt-0.5">Exclusive offers available to residents of {profile.name}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {promos.map((promo) => (
                  <div key={promo.id} className="px-6 py-5 flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-lg font-bold"
                      style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
                    >
                      %
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                          <p className="text-sm text-gray-500">{promo.partnerName}</p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
                          {promo.discountText}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                      {promo.expiresAt && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          Expires {new Date(promo.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div
            className="rounded-2xl p-8 text-center text-white"
            style={{ background: 'linear-gradient(135deg, #0891B2 0%, #059669 100%)' }}
          >
            <h2 className="text-2xl font-bold mb-2">Ready to take the next step?</h2>
            <p className="text-white/80 mb-6 text-sm">
              Apply for a bed at {profile.name} today. Our team will review your application promptly.
            </p>
            <Link
              href={`/apply/bed?tenantId=${profile.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              Apply for a Bed
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
