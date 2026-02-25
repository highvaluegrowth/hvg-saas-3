import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Resident, ResidentEvent } from '../types/resident.types';
import type { CreateResidentInput, CreateResidentEventInput } from '../schemas/resident.schemas';

class ResidentService extends BaseRepository<Resident> {
  constructor() {
    super(adminDb, 'residents');
  }

  async createResident(input: CreateResidentInput): Promise<Resident> {
    return this.create({
      ...input,
      secondarySubstances: input.secondarySubstances ?? [],
      treatmentHistory: input.treatmentHistory ?? '',
      allergies: input.allergies ?? [],
      medications: input.medications ?? [],
      diagnosisCodes: input.diagnosisCodes ?? [],
      notes: input.notes ?? '',
    });
  }

  async updateResident(id: string, input: Partial<CreateResidentInput>): Promise<void> {
    return this.update(id, input);
  }

  async searchByName(query: string): Promise<Resident[]> {
    const lower = query.toLowerCase();
    const result = await this.query({
      orderBy: { field: 'lastName', direction: 'asc' },
      limit: 50,
    });
    return result.items.filter(
      (r) =>
        r.firstName.toLowerCase().includes(lower) ||
        r.lastName.toLowerCase().includes(lower)
    );
  }

  // Resident events (subcollection)
  private eventsPath(residentId: string) {
    return `residents/${residentId}/events`;
  }

  async getEvents(residentId: string): Promise<ResidentEvent[]> {
    const snapshot = await adminDb
      .collection(this.eventsPath(residentId))
      .orderBy('scheduledAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledAt: data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt),
        completedAt: data.completedAt?.toDate?.() ?? (data.completedAt ? new Date(data.completedAt) : undefined),
        createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt),
      } as ResidentEvent;
    });
  }

  async createEvent(residentId: string, input: CreateResidentEventInput): Promise<ResidentEvent> {
    const now = new Date();
    const docRef = adminDb.collection(this.eventsPath(residentId)).doc();
    const event: Omit<ResidentEvent, 'id'> = {
      residentId,
      type: input.type,
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(event);
    return { id: docRef.id, ...event };
  }

  async updateEvent(
    residentId: string,
    eventId: string,
    data: { status?: ResidentEvent['status']; completedAt?: Date; description?: string }
  ): Promise<void> {
    await adminDb.collection(this.eventsPath(residentId)).doc(eventId).update({
      ...data,
      updatedAt: new Date(),
    });
  }
}

export const residentService = new ResidentService();
