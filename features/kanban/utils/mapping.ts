import type { BoardColumnId, BoardItemType } from '../types';

/**
 * Reverse mapping: converts a board column back to the Firestore-native status
 * string that should be written on a drop event.
 *
 * Returns `null` when the transition is either not allowed via a simple PATCH
 * (e.g. application → resolved requires a Resolution Modal) or not applicable.
 */
export function mapColumnIdToNativeStatus(
  type: BoardItemType,
  columnId: BoardColumnId
): string | null {
  switch (type) {
    case 'chore':
      if (columnId === 'action_required') return 'pending';
      if (columnId === 'in_progress') return 'in_progress';
      if (columnId === 'resolved') return 'completed';
      return null;

    case 'application':
      // pending_triage is set by the creation flow — not patchable via tenant API
      if (columnId === 'action_required') return null;
      // waitlisted is a valid tenant PATCH status, maps naturally to "in progress"
      if (columnId === 'in_progress') return 'waitlisted';
      // resolved requires user to choose Admit or Reject — signal with null
      if (columnId === 'resolved') return null;
      return null;

    case 'task':
      if (columnId === 'action_required') return 'todo';
      if (columnId === 'in_progress') return 'doing';
      if (columnId === 'resolved') return 'done';
      return null;

    default:
      return null;
  }
}

/**
 * Maps a raw Firestore status string to one of the three unified board columns.
 * Falls back to `in_progress` for any unrecognised status so items are never lost.
 */
export function mapToColumnId(type: BoardItemType, nativeStatus: string): BoardColumnId {
  switch (type) {
    case 'application': {
      // pending_triage: super_admin needs to act → action_required
      // assigned / assigned_to_tenant / reviewing / waitlisted: work in flight → in_progress
      // accepted / admitted / rejected / archived: terminal states → resolved
      const actionRequired = ['pending_triage', 'pending'];
      const resolved = ['accepted', 'admitted', 'rejected', 'archived'];
      if (actionRequired.includes(nativeStatus)) return 'action_required';
      if (resolved.includes(nativeStatus)) return 'resolved';
      return 'in_progress';
    }

    case 'chore': {
      // pending: no one has started → action_required
      // in_progress: someone is working on it → in_progress
      // done / completed / overdue: finished (or lapsed) → resolved
      if (nativeStatus === 'pending') return 'action_required';
      if (nativeStatus === 'in_progress') return 'in_progress';
      return 'resolved'; // done | completed | overdue
    }

    case 'task': {
      // todo: not started → action_required
      // doing: in flight → in_progress
      // done / cancelled: finished → resolved
      if (nativeStatus === 'todo') return 'action_required';
      if (nativeStatus === 'doing') return 'in_progress';
      return 'resolved'; // done | cancelled
    }

    default:
      return 'in_progress';
  }
}
