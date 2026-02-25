/**
 * Firestore Service Layer
 *
 * This module provides a clean abstraction over Firestore operations.
 *
 * Usage:
 *
 * 1. Create a domain-specific repository:
 *
 * ```typescript
 * import { TenantRepository } from '@/lib/firestore/tenantRepository';
 * import { adminDb } from '@/lib/firebase/admin';
 *
 * interface House extends BaseDocument {
 *   tenantId: string;
 *   name: string;
 *   address: string;
 *   capacity: number;
 * }
 *
 * class HouseRepository extends TenantRepository<House> {
 *   constructor(tenantId: string) {
 *     super(adminDb, tenantId, 'houses');
 *   }
 *
 *   // Add domain-specific methods
 *   async getByStatus(status: string) {
 *     return this.query({
 *       where: [{ field: 'status', operator: '==', value: status }]
 *     });
 *   }
 * }
 * ```
 *
 * 2. Use in API routes or Server Actions:
 *
 * ```typescript
 * export async function getHouses(tenantId: string) {
 *   const houseRepo = new HouseRepository(tenantId);
 *   const result = await houseRepo.getAll();
 *   return result;
 * }
 * ```
 */

export { BaseRepository } from './baseRepository';
export { TenantRepository } from './tenantRepository';
export * from './types';
export * from './converters';
