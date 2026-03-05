import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface DirectoryTenant {
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
}

const SPECIALIZATION_FILTERS = [
  { label: 'Faith-Based', value: 'faith-based' },
  { label: 'LGBTQ+ Affirming', value: 'LGBTQ+ affirming' },
  { label: 'Veteran-Focused', value: 'veteran-focused' },
  { label: 'MAT-Friendly', value: 'MAT-friendly' },
  { label: 'Women Only', value: 'women-only' },
  { label: 'Men Only', value: 'men-only' },
];

const FUNDING_FILTERS = [
  { label: 'Medicaid', value: 'Medicaid' },
  { label: 'Medicare', value: 'Medicare' },
  { label: 'VA', value: 'VA' },
  { label: 'SOR', value: 'SOR' },
  { label: 'Private Insurance', value: 'Private Insurance' },
  { label: 'Self-Pay', value: 'Self-Pay' },
];

async function getListedTenants(): Promise<DirectoryTenant[]> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .where('directory.listed', '==', true)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const dir = data.directory ?? {};
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
      };
    });
  } catch (error) {
    console.error('Failed to fetch directory tenants:', error);
    return [];
  }
}

function TenantCard({ tenant }: { tenant: DirectoryTenant }) {
  const initials = tenant.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="p-6 flex items-start gap-4">
        {tenant.logoURL ? (
          <img
            src={tenant.logoURL}
            alt={`${tenant.name} logo`}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
          >
            {initials || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{tenant.name}</h3>
          {(tenant.city || tenant.state) && (
            <p className="text-sm text-gray-500 mt-0.5">
              {[tenant.city, tenant.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {tenant.description && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 line-clamp-3">{tenant.description}</p>
        </div>
      )}

      {/* Specialization pills */}
      {tenant.specializations.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-1.5">
          {tenant.specializations.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-100"
            >
              {spec}
            </span>
          ))}
        </div>
      )}

      {/* Accepted funding */}
      {tenant.acceptedFunding.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-1.5">
          {tenant.acceptedFunding.map((f) => (
            <span
              key={f}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-auto px-6 py-4 border-t border-gray-50 flex items-center justify-between gap-3">
        <Link
          href={`/directory/${tenant.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          View Profile
        </Link>
        <Link
          href={`/apply/bed?tenantId=${tenant.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
        >
          Apply for a Bed
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default async function DirectoryPage() {
  const tenants = await getListedTenants();

  return (
    <main style={{ fontFamily: 'var(--font-figtree), sans-serif' }}>
      <MarketingNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Sober Living Directory
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find a Sober Living Home
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse verified recovery residences across the country. Filter by specialization, accepted funding,
            and location to find the right fit for your journey.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {tenants.length} {tenants.length === 1 ? 'home' : 'homes'} listed
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-12 px-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Filter pills */}
          <div className="mb-8 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Specialization</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATION_FILTERS.map((f) => (
                  <span
                    key={f.value}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 cursor-default select-none"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Accepted Funding</p>
              <div className="flex flex-wrap gap-2">
                {FUNDING_FILTERS.map((f) => (
                  <span
                    key={f.value}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 cursor-default select-none"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {tenants.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No homes listed yet</h3>
              <p className="text-gray-500 mb-6">Operators can list their organization in the directory from their dashboard.</p>
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}
              >
                Apply for a Bed
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {tenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
