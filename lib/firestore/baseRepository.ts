import { Firestore, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { BaseDocument, QueryOptions, PaginatedResult, WhereClause } from './types';
import { timestampToDate, prepareUpdateData, dateToTimestamp } from './converters';

/**
 * Generic base repository providing CRUD operations for Firestore collections.
 * All domain repositories should extend this class.
 *
 * @template T - Document type extending BaseDocument
 */
export abstract class BaseRepository<T extends BaseDocument> {
  protected db: Firestore;
  protected collectionPath: string;

  constructor(db: Firestore, collectionPath: string) {
    this.db = db;
    this.collectionPath = collectionPath;
  }

  /**
   * Creates a new document in Firestore
   * @param data - Document data without id, createdAt, updatedAt
   * @returns Created document with generated ID
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const docRef = this.db.collection(this.collectionPath).doc();
    const now = dateToTimestamp(data);

    await docRef.set({
      ...data,
      ...now,
    });

    const snapshot = await docRef.get();
    const docData = snapshot.data() as DocumentData;
    const { id: _id, ...rest } = timestampToDate(docData as any);

    return {
      id: docRef.id,
      ...rest,
    } as T;
  }

  /**
   * Retrieves a document by ID
   * @param id - Document ID
   * @returns Document or null if not found
   */
  async getById(id: string): Promise<T | null> {
    const docRef = this.db.collection(this.collectionPath).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as DocumentData;
    const { id: _id, ...converted } = timestampToDate(data as any);
    return {
      id: snapshot.id,
      ...converted,
    } as T;
  }

  /**
   * Updates a document by ID
   * @param id - Document ID
   * @param data - Partial document data to update
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = this.db.collection(this.collectionPath).doc(id);
    const updateData = prepareUpdateData(data);

    await docRef.update(updateData);
  }

  /**
   * Deletes a document by ID
   * @param id - Document ID
   */
  async delete(id: string): Promise<void> {
    const docRef = this.db.collection(this.collectionPath).doc(id);
    await docRef.delete();
  }

  /**
   * Queries documents with filtering, ordering, and pagination
   * @param options - Query options
   * @returns Paginated result with documents
   */
  async query(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    let query: FirebaseFirestore.Query = this.db.collection(this.collectionPath);

    // Apply where clauses
    if (options.where) {
      options.where.forEach((clause: WhereClause) => {
        query = query.where(clause.field, clause.operator, clause.value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }

    // Apply pagination
    if (options.startAfter) {
      query = query.startAfter(options.startAfter);
    }

    if (options.limit) {
      query = query.limit(options.limit + 1); // Fetch one extra to check if there's more
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const { id: _id, ...converted } = timestampToDate(doc.data() as any);
      return { id: doc.id, ...converted };
    }) as T[];

    // Check if there are more results
    const hasMore = options.limit ? docs.length > options.limit : false;
    const items = hasMore ? docs.slice(0, options.limit) : docs;
    const lastDoc = items.length > 0 ? snapshot.docs[items.length - 1] : undefined;

    return {
      items,
      lastDoc,
      hasMore,
    };
  }

  /**
   * Gets all documents in the collection
   * @returns Array of all documents
   */
  async getAll(): Promise<T[]> {
    const snapshot = await this.db.collection(this.collectionPath).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const { id: _id, ...converted } = timestampToDate(doc.data() as any);
      return { id: doc.id, ...converted };
    }) as T[];
  }

  /**
   * Counts documents matching the query
   * @param options - Query options
   * @returns Number of matching documents
   */
  async count(options: QueryOptions = {}): Promise<number> {
    let query: FirebaseFirestore.Query = this.db.collection(this.collectionPath);

    if (options.where) {
      options.where.forEach((clause: WhereClause) => {
        query = query.where(clause.field, clause.operator, clause.value);
      });
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Checks if a document exists
   * @param id - Document ID
   * @returns True if document exists
   */
  async exists(id: string): Promise<boolean> {
    const docRef = this.db.collection(this.collectionPath).doc(id);
    const snapshot = await docRef.get();
    return snapshot.exists;
  }
}
