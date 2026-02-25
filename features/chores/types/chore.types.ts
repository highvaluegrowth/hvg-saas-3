import { BaseDocument } from '@/lib/firestore/types';

export type ChoreStatus = 'pending' | 'in_progress' | 'done' | 'overdue';
export type ChorePriority = 'low' | 'medium' | 'high';

export interface Chore extends BaseDocument {
  tenantId: string;
  title: string;
  description?: string;
  houseIds: string[];
  assigneeIds: string[];
  dueDate?: Date;
  status: ChoreStatus;
  priority: ChorePriority;
  createdBy: string;
}
