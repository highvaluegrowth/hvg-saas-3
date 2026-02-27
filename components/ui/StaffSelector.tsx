'use client';

import { useState, useMemo } from 'react';
import { useStaff } from '@/features/staff/hooks/useStaff';

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
  const { staff } = useStaff(tenantId);
  const [search, setSearch] = useState('');

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
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {selectedStaff.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedStaff.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
            >
              {s.firstName} {s.lastName}
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="text-blue-500 hover:text-blue-700 ml-0.5 leading-none"
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />

      <div className={`border border-gray-200 rounded-md overflow-y-auto ${maxHeight}`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 p-3 text-center">
            {staff.length === 0 ? 'No staff members' : 'No staff match search'}
          </p>
        ) : (
          <ul>
            {filtered.map((member) => {
              const checked = selectedIds.includes(member.id);
              return (
                <li key={member.id}>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type={singleSelect ? 'radio' : 'checkbox'}
                      checked={checked}
                      onChange={() => toggle(member.id)}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-900">
                      {member.firstName} {member.lastName}
                    </span>
                    <span className="text-xs text-gray-500 capitalize ml-auto">
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
