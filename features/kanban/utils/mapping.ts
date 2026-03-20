import type { BoardColumnId, BoardItemType } from '../types';

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
