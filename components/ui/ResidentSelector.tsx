'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';

interface ResidentOption {
  id: string;
  name: string;
}

interface ResidentSelectorProps {
  tenantId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
}

export function ResidentSelector({
  tenantId,
  selectedIds,
  onChange,
  label = 'Residents',
  placeholder = 'Search residents...',
  maxHeight = 'max-h-48',
}: ResidentSelectorProps) {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResidents = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/residents?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      
      const options = (data.residents || []).map((r: any) => ({
        id: r.id,
        name: r.name || `${r.firstName} ${r.lastName}`.trim() || 'Unknown'
      }));
      
      options.sort((a: ResidentOption, b: ResidentOption) => a.name.localeCompare(b.name));
      setResidents(options);
    } catch (e) {
      console.error('ResidentSelector fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const filtered = useMemo(
    () =>
      residents.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [residents, search]
  );

  const selectedResidents = residents.filter((r) => selectedIds.includes(r.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">{label}</label>
      )}

      {selectedResidents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedResidents.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20"
            >
              {r.name}
              <button
                type="button"
                onClick={() => toggle(r.id)}
                className="text-cyan-500 hover:text-cyan-300 ml-0.5 leading-none"
                aria-label={`Remove ${r.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />

      <div className={`border border-white/10 rounded-md overflow-y-auto bg-white/5 ${maxHeight}`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-white/40 p-3 text-center">
            {residents.length === 0 ? 'No active residents' : 'No residents match search'}
          </p>
        ) : (
          <ul>
            {filtered.map((resident) => {
              const checked = selectedIds.includes(resident.id);
              return (
                <li key={resident.id}>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(resident.id)}
                      className="rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-white/90">{resident.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
