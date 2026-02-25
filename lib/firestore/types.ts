import { Timestamp } from 'firebase/firestore';

/**
 * Base document interface that all Firestore documents extend.
 * Includes standard metadata fields.
 */
export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore-specific document type (with Timestamp).
 * Used for server-side operations with Admin SDK.
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions {
  where?: WhereClause[];
  orderBy?: OrderByClause;
  limit?: number;
  startAfter?: any;
}

export interface WhereClause {
  field: string;
  operator: FirestoreOperator;
  value: any;
}

export type FirestoreOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

export interface OrderByClause {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Repository result types
 */
export interface PaginatedResult<T> {
  items: T[];
  lastDoc?: any;
  hasMore: boolean;
  total?: number;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
