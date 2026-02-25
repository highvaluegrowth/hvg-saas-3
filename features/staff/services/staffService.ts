import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { StaffMember } from '../types/staff.types';
import type { CreateStaffInput, UpdateStaffInput } from '../schemas/staff.schemas';

class StaffService extends BaseRepository<StaffMember> {
  constructor(private tenantId: string) {
    super(adminDb, `tenants/${tenantId}/staff`);
  }

  async createStaff(input: CreateStaffInput): Promise<StaffMember> {
    return this.create({
      ...input,
      tenantId: this.tenantId,
      houseIds: input.houseIds ?? [],
      status: 'active',
    });
  }

  async updateStaff(staffId: string, input: UpdateStaffInput): Promise<void> {
    return this.update(staffId, input);
  }

  async deactivate(staffId: string): Promise<void> {
    return this.update(staffId, { status: 'inactive' });
  }

  async getActiveStaff(): Promise<StaffMember[]> {
    const result = await this.query({
      where: [{ field: 'status', operator: '==', value: 'active' }],
      orderBy: { field: 'lastName', direction: 'asc' },
    });
    return result.items;
  }

  async getByHouseId(houseId: string): Promise<StaffMember[]> {
    const result = await this.query({
      where: [{ field: 'houseIds', operator: 'array-contains', value: houseId }],
    });
    return result.items;
  }

  async getByUserId(userId: string): Promise<StaffMember | null> {
    const result = await this.query({
      where: [{ field: 'userId', operator: '==', value: userId }],
      limit: 1,
    });
    return result.items[0] ?? null;
  }
}

export function createStaffService(tenantId: string): StaffService {
  return new StaffService(tenantId);
}
