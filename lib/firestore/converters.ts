import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument, FirestoreDocument } from './types';

/**
 * Converts Firestore Timestamps to JavaScript Dates
 * @param doc - Firestore document with Timestamps
 * @returns Document with Date objects
 */
export function timestampToDate<T extends FirestoreDocument>(
  doc: T
): Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date } {
  return {
    ...doc,
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
  };
}

/**
 * Converts JavaScript Dates to Firestore Timestamps
 * @param doc - Document with Date objects
 * @returns Document with Firestore Timestamps
 */
export function dateToTimestamp<T extends BaseDocument>(
  doc: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
} {
  return {
    ...doc,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as any;
}

/**
 * Prepares data for Firestore update (only updatedAt)
 * @param data - Partial document data
 * @returns Data with updated timestamp
 */
export function prepareUpdateData<T>(
  data: Partial<T>
): Partial<T> & { updatedAt: Timestamp } {
  return {
    ...data,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Strips metadata fields from document for creation
 * @param data - Document data
 * @returns Data without id, createdAt, updatedAt
 */
export function stripMetadata<T extends BaseDocument>(
  data: T
): Omit<T, 'id' | 'createdAt' | 'updatedAt'> {
  const { id, createdAt, updatedAt, ...rest } = data;
  return rest as Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}
