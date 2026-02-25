import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Chore } from '../types/chore.types';
import type { CreateChoreInput, UpdateChoreInput } from '../schemas/chore.schemas';

class ChoreService extends BaseRepository<Chore> {
  private tenantId: string;

  constructor(tenantId: string) {
    super(adminDb, `tenants/${tenantId}/chores`);
    this.tenantId = tenantId;
  }

  async createChore(input: CreateChoreInput, createdBy: string): Promise<Chore> {
    return this.create({
      ...input,
      tenantId: this.tenantId,
      houseIds: input.houseIds ?? [],
      assigneeIds: input.assigneeIds ?? [],
      status: 'pending',
      priority: input.priority ?? 'medium',
      createdBy,
    });
  }

  async updateChore(choreId: string, input: UpdateChoreInput): Promise<void> {
    return this.update(choreId, input);
  }

  async deleteChore(choreId: string): Promise<void> {
    return this.delete(choreId);
  }

  async getAllChores(): Promise<Chore[]> {
    const result = await this.query({
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
    return result.items;
  }

  async assignResident(choreId: string, residentId: string): Promise<void> {
    const chore = await this.getById(choreId);
    if (!chore) throw new Error('Chore not found');
    if (chore.assigneeIds.includes(residentId)) return;
    return this.update(choreId, {
      assigneeIds: [...chore.assigneeIds, residentId],
    });
  }

  async unassignResident(choreId: string, residentId: string): Promise<void> {
    const chore = await this.getById(choreId);
    if (!chore) throw new Error('Chore not found');
    return this.update(choreId, {
      assigneeIds: chore.assigneeIds.filter((id) => id !== residentId),
    });
  }
}

export function createChoreService(tenantId: string): ChoreService {
  return new ChoreService(tenantId);
}
