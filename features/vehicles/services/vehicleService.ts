import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { Vehicle, MaintenanceLog } from '../types/vehicle.types';
import type { CreateVehicleInput, UpdateVehicleInput, CreateMaintenanceLogInput } from '../schemas/vehicle.schemas';
import { timestampToDate, dateToTimestamp } from '@/lib/firestore/converters';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

class VehicleService extends BaseRepository<Vehicle> {
  constructor(private tenantId: string) {
    super(adminDb, `tenants/${tenantId}/vehicles`);
  }

  async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    return this.create({
      ...input,
      tenantId: this.tenantId,
      approvedDriverIds: input.approvedDriverIds ?? [],
    });
  }

  async updateVehicle(vehicleId: string, input: UpdateVehicleInput): Promise<void> {
    return this.update(vehicleId, input);
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    const result = await this.query({
      where: [{ field: 'status', operator: '==', value: 'active' }],
      orderBy: { field: 'make', direction: 'asc' },
    });
    return result.items;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    const result = await this.query({
      orderBy: { field: 'make', direction: 'asc' },
    });
    return result.items;
  }

  async getMaintenanceLogs(vehicleId: string): Promise<MaintenanceLog[]> {
    const snapshot = await adminDb
      .collection(`${this.collectionPath}/${vehicleId}/maintenanceLogs`)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      const converted = timestampToDate(data as any);
      return {
        id: doc.id,
        vehicleId,
        tenantId: this.tenantId,
        ...converted,
      } as unknown as MaintenanceLog;
    });
  }

  async addMaintenanceLog(
    vehicleId: string,
    input: CreateMaintenanceLogInput
  ): Promise<MaintenanceLog> {
    const docRef = adminDb
      .collection(`${this.collectionPath}/${vehicleId}/maintenanceLogs`)
      .doc();

    const now = new Date();
    const data = {
      ...input,
      vehicleId,
      tenantId: this.tenantId,
      createdAt: now,
    };

    await docRef.set(data);

    return {
      id: docRef.id,
      ...data,
    } as MaintenanceLog;
  }
}

export function createVehicleService(tenantId: string): VehicleService {
  return new VehicleService(tenantId);
}
