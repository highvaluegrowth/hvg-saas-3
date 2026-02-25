import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { ProgramEvent } from '../types/event.types';
import type { CreateProgramEventInput, UpdateProgramEventInput } from '../schemas/event.schemas';

class EventService extends BaseRepository<ProgramEvent> {
  constructor(private tenantId: string) {
    super(adminDb, `tenants/${tenantId}/events`);
  }

  async createEvent(input: CreateProgramEventInput, createdBy: string): Promise<ProgramEvent> {
    return this.create({
      ...input,
      tenantId: this.tenantId,
      houseIds: input.houseIds ?? [],
      attendeeIds: [],
      createdBy,
    });
  }

  async updateEvent(eventId: string, input: UpdateProgramEventInput): Promise<void> {
    return this.update(eventId, input);
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.delete(eventId);
  }

  async addAttendee(eventId: string, residentId: string): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Event not found');
    if (event.attendeeIds.includes(residentId)) return;
    return this.update(eventId, {
      attendeeIds: [...event.attendeeIds, residentId],
    });
  }

  async removeAttendee(eventId: string, residentId: string): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Event not found');
    return this.update(eventId, {
      attendeeIds: event.attendeeIds.filter((id) => id !== residentId),
    });
  }

  async getUpcoming(limit = 10): Promise<ProgramEvent[]> {
    const now = new Date();
    const result = await this.query({
      where: [{ field: 'scheduledAt', operator: '>=', value: now }],
      orderBy: { field: 'scheduledAt', direction: 'asc' },
      limit,
    });
    return result.items;
  }

  async getForHouse(houseId: string): Promise<ProgramEvent[]> {
    const result = await this.query({
      where: [{ field: 'houseIds', operator: 'array-contains', value: houseId }],
      orderBy: { field: 'scheduledAt', direction: 'asc' },
    });
    return result.items;
  }
}

export function createEventService(tenantId: string): EventService {
  return new EventService(tenantId);
}
