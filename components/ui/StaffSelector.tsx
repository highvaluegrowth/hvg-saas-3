'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface StaffSelectorProps {
  tenantId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
  singleSelect?: boolean;
}

export function StaffSelector({
  tenantId,
  selectedIds,
  onChange,
  label = 'Staff',
  placeholder = 'Search staff...',
  maxHeight = 'max-h-48',
  singleSelect = false,
}: StaffSelectorProps) {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      
      const options = (data.staff || []).map((s: any) => ({
        id: s.id,
        firstName: s.firstName || s.name?.split(' ')[0] || 'Unknown',
        lastName: s.lastName || s.name?.split(' ')[1] || 'Staff',
        role: s.role || 'staff'
      }));
      
      setStaff(options);
    } catch (e) {
      console.error('StaffSelector fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
      }),
    [staff, search]
  );

  const selectedStaff = staff.filter((s) => selectedIds.includes(s.id));

  function toggle(id: string) {
    if (singleSelect) {
      onChange(selectedIds.includes(id) ? [] : [id]);
    } else {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((s) => s !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">{label}</label>
      )}

      {selectedStaff.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedStaff.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20"
            >
              {s.firstName} {s.lastName}
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="text-cyan-500 hover:text-cyan-300 ml-0.5 leading-none"
                aria-label={`Remove ${s.firstName} ${s.lastName}`}
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
            {staff.length === 0 ? 'No staff members' : 'No staff match search'}
          </p>
        ) : (
          <ul>
            {filtered.map((member) => {
              const checked = selectedIds.includes(member.id);
              return (
                <li key={member.id}>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                    <input
                      type={singleSelect ? 'radio' : 'checkbox'}
                      checked={checked}
                      onChange={() => toggle(member.id)}
                      className="rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-white/90">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-xs text-white/40 capitalize ml-auto">
                      {member.role.replace('_', ' ')}
                    </span>
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
