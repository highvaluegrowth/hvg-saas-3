'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';

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

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function avatarGradient(type: ContactType): string {
  switch (type) {
    case 'resident': return 'linear-gradient(135deg,rgba(5,150,105,0.5),rgba(4,120,87,0.5))';
    case 'staff': return 'linear-gradient(135deg,rgba(8,145,178,0.5),rgba(7,89,133,0.5))';
    case 'external': return 'linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.5))';
  }
}

function avatarColor(type: ContactType): string {
  switch (type) {
    case 'resident': return '#6EE7B7';
    case 'staff': return '#67E8F9';
    case 'external': return '#C4B5FD';
  }
}

function badgeStyle(type: ContactType): React.CSSProperties {
  switch (type) {
    case 'resident': return { background: 'rgba(5,150,105,0.2)', color: '#6EE7B7', border: '1px solid rgba(5,150,105,0.3)' };
    case 'staff': return { background: 'rgba(8,145,178,0.2)', color: '#67E8F9', border: '1px solid rgba(8,145,178,0.3)' };
    case 'external': return { background: 'rgba(139,92,246,0.2)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' };
  }
}

function typeLabel(type: ContactType): string {
  return { resident: 'Resident', staff: 'Staff', external: 'External' }[type];
}

function exportCsv(contacts: Contact[]) {
  const header = ['Name', 'Type', 'Role', 'Phone', 'Email', 'Tags'];
  const rows = contacts.map((c) => [c.name, typeLabel(c.type), c.role, c.phone, c.email, c.tags.join('; ')]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface AddContactModalProps { tenantId: string; onClose: () => void; onAdded: () => void; }

function AddContactModal({ tenantId, onClose, onAdded }: AddContactModalProps) {
  const [form, setForm] = useState<AddContactForm>({ name: '', role: '', phone: '', email: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      const token = await authService.getIdToken();
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch(`/api/tenants/${tenantId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name.trim(), role: form.role.trim(), phone: form.phone.trim(), email: form.email.trim(), tags }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      onAdded();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" style={{ background: 'rgba(8,26,46,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add External Contact</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[{ l: 'Name *', f: 'name', t: 'text', p: 'Full name' }, { l: 'Role / Title', f: 'role', t: 'text', p: 'e.g. Probation Officer' }].map(({ l, f, t, p }) => (
            <div key={f}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{l}</label>
              <input type={t} value={form[f as keyof AddContactForm]} onChange={(e) => setForm(x => ({ ...x, [f]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-white/25" style={inp} placeholder={p} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[{ l: 'Phone', f: 'phone', t: 'tel', p: '(555) 000-0000' }, { l: 'Email', f: 'email', t: 'email', p: 'email@example.com' }].map(({ l, f, t, p }) => (
              <div key={f}>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{l}</label>
                <input type={t} value={form[f as keyof AddContactForm]} onChange={(e) => setForm(x => ({ ...x, [f]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-white/25" style={inp} placeholder={p} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Tags</label>
            <input type="text" value={form.tags} onChange={(e) => setForm(x => ({ ...x, tags: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-white/25" style={inp} placeholder="vip, legal, medical (comma-separated)" />
          </div>
          {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ContactsPageProps { params: Promise<{ tenantId: string }>; }

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
      const h = { Authorization: `Bearer ${token}` };
      const [rRes, sRes, eRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/residents`, { headers: h }).catch(() => null),
        fetch(`/api/tenants/${tenantId}/staff`, { headers: h }).catch(() => null),
        fetch(`/api/tenants/${tenantId}/contacts`, { headers: h }).catch(() => null),
      ]);
      const rD = rRes?.ok ? await rRes.json() : {};
      const sD = sRes?.ok ? await sRes.json() : {};
      const eD = eRes?.ok ? await eRes.json() : {};
      const map = (arr: { id: string; name?: string; displayName?: string; email?: string; phone?: string; role?: string }[], type: ContactType): Contact[] =>
        arr.map(x => ({ id: x.id, name: x.name ?? x.displayName ?? 'Unknown', role: x.role ?? type, phone: x.phone ?? '', email: x.email ?? '', tags: [], type }));
      const ext: Contact[] = (eD.contacts ?? []).map((c: { id: string; name?: string; role?: string; phone?: string; email?: string; tags?: string[] }) => ({ id: c.id, name: c.name ?? 'Unknown', role: c.role ?? '', phone: c.phone ?? '', email: c.email ?? '', tags: c.tags ?? [], type: 'external' as ContactType }));
      setContacts([...map(rD.residents ?? [], 'resident'), ...map(sD.staff ?? [], 'staff'), ...ext]);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function handleDelete(contact: Contact) {
    if (contact.type !== 'external') return;
    setDeletingId(contact.id);
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/contacts?id=${contact.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setContacts(p => p.filter(c => c.id !== contact.id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  const filtered = contacts.filter(c => {
    const matchTab = tab === 'all' || c.type === tab;
    const q = search.toLowerCase();
    return matchTab && (!q || [c.name, c.role, c.email, c.phone, ...c.tags].some(v => v.toLowerCase().includes(q)));
  });

  const tabs = [
    { label: 'All', value: 'all' as TabFilter, count: contacts.length },
    { label: 'Residents', value: 'resident' as TabFilter, count: contacts.filter(c => c.type === 'resident').length },
    { label: 'Staff', value: 'staff' as TabFilter, count: contacts.filter(c => c.type === 'staff').length },
    { label: 'External', value: 'external' as TabFilter, count: contacts.filter(c => c.type === 'external').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Residents, staff, and external contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportCsv(filtered)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: 'linear-gradient(135deg,#0891B2,#059669)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Contact
          </button>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, email, or tags..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {tabs.map(({ label, value, count }) => (
          <button key={value} onClick={() => setTab(value)}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
            style={tab === value ? { background: 'rgba(8,145,178,0.25)', border: '1px solid rgba(103,232,249,0.2)', color: 'white' } : { color: 'rgba(255,255,255,0.45)' }}>
            {label}{count > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>{count}</span>}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {loading ? (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {search ? `No contacts matching "${search}"` : 'No contacts yet'}
            </p>
            {!search && tab === 'external' && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm font-medium hover:underline" style={{ color: '#67E8F9' }}>
                Add your first external contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.35)' }}>Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'rgba(255,255,255,0.35)' }}>Tags</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {filtered.map(contact => (
                  <tr key={contact.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ background: avatarGradient(contact.type), color: avatarColor(contact.type), border: '1px solid rgba(255,255,255,0.1)' }}>
                          {getInitials(contact.name)}
                        </div>
                        <div>
                          <p className="font-medium text-white leading-tight">{contact.name}</p>
                          {contact.role && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.role}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={badgeStyle(contact.type)}>{typeLabel(contact.type)}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {contact.phone || <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {contact.email ? <a href={`mailto:${contact.email}`} className="hover:text-cyan-400 transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>{contact.email}</a> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length > 0 ? contact.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{tag}</span>
                        )) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {contact.type === 'external' && (
                        <button onClick={() => handleDelete(contact)} disabled={deletingId === contact.id}
                          className="text-xs font-medium transition-colors disabled:opacity-40" style={{ color: 'rgba(248,113,113,0.8)' }}>
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

      {showModal && <AddContactModal tenantId={tenantId} onClose={() => setShowModal(false)} onAdded={() => { setShowModal(false); fetchContacts(); }} />}
    </div>
  );
}
