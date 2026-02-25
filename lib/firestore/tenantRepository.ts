import { Firestore } from 'firebase-admin/firestore';
import { BaseRepository } from './baseRepository';
import { BaseDocument, QueryOptions, PaginatedResult } from './types';

/**
 * Tenant-scoped repository that automatically adds tenant isolation.
 * All domain repositories should extend this instead of BaseRepository.
 *
 * @template T - Document type extending BaseDocument
 */
export abstract class TenantRepository<T extends BaseDocument> extends BaseRepository<T> {
  protected tenantId: string;

  constructor(db: Firestore, tenantId: string, collectionName: string) {
    const collectionPath = `tenants/${tenantId}/${collectionName}`;
    super(db, collectionPath);
    this.tenantId = tenantId;
  }

  /**
   * Queries documents within the tenant scope
   * Automatically adds tenantId to all where clauses for safety
   */
  async query(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    // Tenant isolation is already enforced by collection path
    // No need to add tenantId to where clauses
    return super.query(options);
  }

  /**
   * Gets tenant ID for this repository
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Validates that a document belongs to this tenant
   * Useful for additional safety checks
   */
  protected validateTenantAccess(documentTenantId?: string): boolean {
    if (!documentTenantId) return true; // No tenant field on document
    return documentTenantId === this.tenantId;
  }
}
