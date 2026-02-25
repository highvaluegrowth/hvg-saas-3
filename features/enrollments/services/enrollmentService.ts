import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Enrollment } from '../types/enrollment.types';
import type { CreateEnrollmentInput, UpdateEnrollmentInput } from '../schemas/enrollment.schemas';

class EnrollmentService extends BaseRepository<Enrollment> {
  constructor(private tenantId: string) {
    super(adminDb, `tenants/${tenantId}/enrollments`);
  }

  async enroll(input: CreateEnrollmentInput): Promise<Enrollment> {
    // Check if resident is already enrolled
    const existing = await this.getById(input.residentId);
    if (existing) {
      throw new Error('Resident is already enrolled in this organization');
    }

    const docRef = adminDb
      .collection(this.collectionPath)
      .doc(input.residentId); // doc ID = residentId for easy lookup

    const now = new Date();
    const enrollment: Omit<Enrollment, 'id'> = {
      tenantId: this.tenantId,
      residentId: input.residentId,
      houseId: input.houseId ?? null,
      roomId: input.roomId ?? null,
      bedId: input.bedId ?? null,
      status: input.status ?? 'waitlist',
      phase: input.phase ?? 1,
      sobrietyStartDate: input.sobrietyStartDate ?? null,
      moveInDate: input.moveInDate ?? null,
      moveOutDate: null,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(enrollment);
    return { id: docRef.id, ...enrollment };
  }

  async updateEnrollment(residentId: string, input: UpdateEnrollmentInput): Promise<void> {
    return this.update(residentId, input);
  }

  async getByResidentId(residentId: string): Promise<Enrollment | null> {
    return this.getById(residentId);
  }

  async getByHouseId(houseId: string): Promise<Enrollment[]> {
    const result = await this.query({
      where: [{ field: 'houseId', operator: '==', value: houseId }],
    });
    return result.items;
  }

  async getActiveEnrollments(): Promise<Enrollment[]> {
    const result = await this.query({
      where: [{ field: 'status', operator: '==', value: 'active' }],
    });
    return result.items;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const statuses = ['waitlist', 'active', 'graduated', 'discharged'];
    const counts = await Promise.all(
      statuses.map((status) =>
        this.count({ where: [{ field: 'status', operator: '==', value: status }] })
      )
    );
    return Object.fromEntries(statuses.map((s, i) => [s, counts[i]]));
  }
}

export function createEnrollmentService(tenantId: string): EnrollmentService {
  return new EnrollmentService(tenantId);
}
