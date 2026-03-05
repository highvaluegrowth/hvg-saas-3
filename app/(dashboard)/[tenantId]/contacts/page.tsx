'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactType = 'resident' | 'staff' | 'external';
type TabFilter = 'all' | ContactType;

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  tags: string[];
  type: ContactType;
}

interface AddContactForm {
  name: string;
  role: string;
  phone: string;
  email: string;
  tags: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function avatarColorClass(type: ContactType): string {
  switch (type) {
    case 'resident': return 'bg-emerald-100 text-emerald-700';
    case 'staff':    return 'bg-blue-100 text-blue-700';
    case 'external': return 'bg-purple-100 text-purple-700';
  }
}

function typeBadgeClass(type: ContactType): string {
  switch (type) {
    case 'resident': return 'bg-emerald-100 text-emerald-700';
    case 'staff':    return 'bg-blue-100 text-blue-700';
    case 'external': return 'bg-purple-100 text-purple-700';
  }
}

function typeLabel(type: ContactType): string {
  switch (type) {
    case 'resident': return 'Resident';
    case 'staff':    return 'Staff';
    case 'external': return 'External';
  }
}

function exportCsv(contacts: Contact[]) {
  const header = ['Name', 'Type', 'Role', 'Phone', 'Email', 'Tags'];
  const rows = contacts.map((c) => [
    c.name,
    typeLabel(c.type),
    c.role,
    c.phone,
    c.email,
    c.tags.join('; '),
  ]);
  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'contacts.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────

interface AddContactModalProps {
  tenantId: string;
  onClose: () => void;
  onAdded: () => void;
}

function AddContactModal({ tenantId, onClose, onAdded }: AddContactModalProps) {
  const [form, setForm] = useState<AddContactForm>({
    name: '',
    role: '',
    phone: '',
    email: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await authService.getIdToken();
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/tenants/${tenantId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          tags,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to add contact');
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add External Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role / Title</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g. Probation Officer, Counselor"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="vip, legal, medical (comma-separated)"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ContactsPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function ContactsPage({ params }: ContactsPageProps) {
  const { tenantId } = use(params);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await authService.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [residentsRes, staffRes, externalRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/residents`, { headers }).catch(() => null),
        fetch(`/api/tenants/${tenantId}/staff`, { headers }).catch(() => null),
        fetch(`/api/tenants/${tenantId}/contacts`, { headers }).catch(() => null),
      ]);

      const residentData = residentsRes?.ok ? await residentsRes.json() : {};
      const staffData = staffRes?.ok ? await staffRes.json() : {};
      const externalData = externalRes?.ok ? await externalRes.json() : {};

      const residentContacts: Contact[] = (residentData.residents ?? []).map(
        (r: { id: string; name?: string; displayName?: string; email?: string; phone?: string; role?: string }) => ({
          id: r.id,
          name: r.name ?? r.displayName ?? 'Unknown',
          role: r.role ?? 'Resident',
          phone: r.phone ?? '',
          email: r.email ?? '',
          tags: [],
          type: 'resident' as ContactType,
        })
      );

      const staffContacts: Contact[] = (staffData.staff ?? []).map(
        (s: { id: string; name?: string; displayName?: string; email?: string; phone?: string; role?: string }) => ({
          id: s.id,
          name: s.name ?? s.displayName ?? 'Unknown',
          role: s.role ?? 'Staff',
          phone: s.phone ?? '',
          email: s.email ?? '',
          tags: [],
          type: 'staff' as ContactType,
        })
      );

      const externalContacts: Contact[] = (externalData.contacts ?? []).map(
        (c: { id: string; name?: string; role?: string; phone?: string; email?: string; tags?: string[] }) => ({
          id: c.id,
          name: c.name ?? 'Unknown',
          role: c.role ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
          tags: c.tags ?? [],
          type: 'external' as ContactType,
        })
      );

      setContacts([...residentContacts, ...staffContacts, ...externalContacts]);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  async function handleDelete(contact: Contact) {
    if (contact.type !== 'external') return;
    setDeletingId(contact.id);
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/contacts?id=${contact.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = contacts.filter((c) => {
    const matchesTab = tab === 'all' || c.type === tab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const tabs: { label: string; value: TabFilter; count: number }[] = [
    { label: 'All', value: 'all', count: contacts.length },
    { label: 'Residents', value: 'resident', count: contacts.filter((c) => c.type === 'resident').length },
    { label: 'Staff', value: 'staff', count: contacts.filter((c) => c.type === 'staff').length },
    { label: 'External', value: 'external', count: contacts.filter((c) => c.type === 'external').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Residents, staff, and external contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCsv(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, email, or tags..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(({ label, value, count }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              tab === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === value ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse hidden sm:block" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse hidden md:block" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="w-10 h-10 text-gray-300 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">
              {search ? `No contacts matching "${search}"` : 'No contacts yet'}
            </p>
            {!search && tab === 'external' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm text-cyan-600 hover:underline font-medium"
              >
                Add your first external contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColorClass(contact.type)}`}
                        >
                          {getInitials(contact.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{contact.name}</p>
                          {contact.role && (
                            <p className="text-xs text-gray-500 mt-0.5">{contact.role}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(contact.type)}`}>
                        {typeLabel(contact.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden sm:table-cell">
                      {contact.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="hover:text-cyan-600 transition-colors">
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length > 0 ? (
                          contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {contact.type === 'external' && (
                        <button
                          onClick={() => handleDelete(contact)}
                          disabled={deletingId === contact.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                        >
                          {deletingId === contact.id ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showModal && (
        <AddContactModal
          tenantId={tenantId}
          onClose={() => setShowModal(false)}
          onAdded={() => {
            setShowModal(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
