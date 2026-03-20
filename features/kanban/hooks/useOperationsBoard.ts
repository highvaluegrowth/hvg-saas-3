'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import type { Chore } from '@/features/chores/types/chore.types';
import type { Application } from '@/features/applications/types';
import type { BoardItem, BoardColumnId } from '../types';
import { mapToColumnId } from '../utils/mapping';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applicationToBoardItem(app: Application): BoardItem {
  return {
    id: app.id,
    type: 'application',
    columnId: mapToColumnId('application', app.status),
    nativeStatus: app.status,
    title: app.applicantName || 'Unknown Applicant',
    subtitle: app.applicantEmail || app.type,
    timestamp: new Date(app.submittedAt || app.createdAt),
    rawData: app,
  };
}

function choreToBoardItem(chore: Chore): BoardItem {
  return {
    id: chore.id,
    type: 'chore',
    columnId: mapToColumnId('chore', chore.status),
    nativeStatus: chore.status,
    title: chore.title,
    subtitle: chore.description
      ? chore.description.slice(0, 60) + (chore.description.length > 60 ? '…' : '')
      : `Priority: ${chore.priority}`,
    timestamp: chore.dueDate ?? (chore.createdAt as Date) ?? new Date(),
    rawData: chore,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseOperationsBoardReturn {
  items: BoardItem[];
  itemsByColumn: Record<BoardColumnId, BoardItem[]>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOperationsBoard(tenantId: string | undefined): UseOperationsBoardReturn {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await authService.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Concurrent fetch of Applications and Chores
      const [appsRes, choresRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/applications`, { headers }),
        fetch(`/api/tenants/${tenantId}/chores`, { headers }),
      ]);

      const appsJson = appsRes.ok ? await appsRes.json() : { applications: [] };
      const choresJson = choresRes.ok ? await choresRes.json() : { chores: [] };

      const appItems: BoardItem[] = (appsJson.applications ?? []).map(applicationToBoardItem);
      const choreItems: BoardItem[] = (choresJson.chores ?? []).map(choreToBoardItem);

      // Tasks collection not yet implemented — reserved for future phase
      const taskItems: BoardItem[] = [];

      const merged = [...appItems, ...choreItems, ...taskItems].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setItems(merged);
    } catch (err) {
      console.error('[useOperationsBoard] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Pre-group items by column for O(1) column renders
  const itemsByColumn: Record<BoardColumnId, BoardItem[]> = {
    action_required: [],
    in_progress: [],
    resolved: [],
  };
  for (const item of items) {
    itemsByColumn[item.columnId].push(item);
  }

  return { items, itemsByColumn, isLoading, error, refresh: fetchAll };
}
