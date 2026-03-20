// ─── Unified Operations Board Types ──────────────────────────────────────────

/** The three canonical columns of the Unified Operations Board */
export type BoardColumnId = 'action_required' | 'in_progress' | 'resolved';

/** Source entity types that are aggregated into the board */
export type BoardItemType = 'application' | 'chore' | 'task';

/**
 * Normalised shape every raw Firestore document is mapped into.
 * UI components only consume `BoardItem` — they never touch raw data.
 */
export interface BoardItem {
  /** Firestore document ID */
  id: string;
  /** Which collection this item originated from */
  type: BoardItemType;
  /** Computed destination column (derived from nativeStatus via mapToColumnId) */
  columnId: BoardColumnId;
  /** Original status string from Firestore — preserved for API writes */
  nativeStatus: string;
  /** Primary display label */
  title: string;
  /** Secondary display label (email, description snippet, priority, etc.) */
  subtitle: string;
  /** ISO timestamp used for sorting */
  timestamp: Date;
  /** Escape hatch — the original unmodified Firestore document */
  rawData: unknown;
}

export interface BoardColumn {
  id: BoardColumnId;
  label: string;
  /** Tailwind / hex accent colour for the column header dot */
  color: string;
}

export const BOARD_COLUMNS: BoardColumn[] = [
  { id: 'action_required', label: 'Action Required', color: '#F87171' },
  { id: 'in_progress',     label: 'In Progress',     color: '#67E8F9' },
  { id: 'resolved',        label: 'Resolved',         color: '#6EE7B7' },
];
