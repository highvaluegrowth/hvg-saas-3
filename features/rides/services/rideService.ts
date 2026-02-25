import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Ride } from '../types/ride.types';
import type { CreateRideInput, UpdateRideInput } from '../schemas/ride.schemas';

class RideService extends BaseRepository<Ride> {
  constructor(private tenantId: string) {
    super(adminDb, 'tenants/' + tenantId + '/rides');
  }

  async createRide(input: CreateRideInput): Promise<Ride> {
    const scheduledAt =
      input.scheduledAt instanceof Date
        ? input.scheduledAt
        : new Date(input.scheduledAt as string);

    return this.create({
      ...input,
      tenantId: this.tenantId,
      scheduledAt,
      passengerIds: input.passengerIds ?? [],
      status: input.status ?? 'requested',
    });
  }

  async updateRide(rideId: string, input: UpdateRideInput): Promise<void> {
    const data: Record<string, unknown> = { ...input };
    if (input.scheduledAt !== undefined) {
      data.scheduledAt =
        input.scheduledAt instanceof Date
          ? input.scheduledAt
          : new Date(input.scheduledAt as string);
    }
    return this.update(rideId, data as Partial<Omit<Ride, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>);
  }

  async getByStatus(status: Ride['status']): Promise<Ride[]> {
    const result = await this.query({
      where: [{ field: 'status', operator: '==', value: status }],
      orderBy: { field: 'scheduledAt', direction: 'desc' },
    });
    return result.items;
  }

  async getAllRides(): Promise<Ride[]> {
    const result = await this.query({
      orderBy: { field: 'scheduledAt', direction: 'desc' },
    });
    return result.items;
  }
}

export function createRideService(tenantId: string): RideService {
  return new RideService(tenantId);
}
