'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useEnrollments } from '@/features/enrollments/hooks/useEnrollments';

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
  const { enrollments } = useEnrollments(tenantId, { status: 'active' });
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const ids = enrollments.map((e) => e.residentId).filter(Boolean);
    if (ids.length === 0) {
      setResidents([]);
      return;
    }

    // Batch fetch in chunks of 30 (Firestore 'in' limit)
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }

    Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, 'residents'), where('__name__', 'in', chunk)))
      )
    ).then((snapshots) => {
      const options: ResidentOption[] = snapshots.flatMap((snap) =>
        snap.docs.map((doc) => ({
          id: doc.id,
          name: `${doc.data().firstName} ${doc.data().lastName}`,
        }))
      );
      options.sort((a, b) => a.name.localeCompare(b.name));
      setResidents(options);
    });
  }, [enrollments]);

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
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {selectedResidents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedResidents.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-medium"
            >
              {r.name}
              <button
                type="button"
                onClick={() => toggle(r.id)}
                className="text-cyan-500 hover:text-cyan-700 ml-0.5 leading-none"
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />

      <div className={`border border-gray-200 rounded-md overflow-y-auto ${maxHeight}`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 p-3 text-center">
            {residents.length === 0 ? 'No active residents' : 'No residents match search'}
          </p>
        ) : (
          <ul>
            {filtered.map((resident) => {
              const checked = selectedIds.includes(resident.id);
              return (
                <li key={resident.id}>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(resident.id)}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-900">{resident.name}</span>
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
