import { BaseDocument } from '@/lib/firestore/types';

export interface VehicleInsurance {
  provider: string;
  policyNumber: string;
  expiresAt: Date;
}

export interface VehicleRegistration {
  expiresAt: Date;
}

export interface Vehicle extends BaseDocument {
  tenantId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  seats: number;
  wheelchairAccessible: boolean;
  insurance: VehicleInsurance;
  registration: VehicleRegistration;
  currentMileage: number;
  status: 'active' | 'maintenance' | 'retired';
  approvedDriverIds: string[];
  notes?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  tenantId: string;
  date: Date;
  mileage: number;
  type: 'oil_change' | 'tire' | 'inspection' | 'repair' | 'other';
  description: string;
  cost?: number;
  performedBy?: string;
  createdAt: Date;
}

export type CreateVehicleData = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVehicleData = Partial<Omit<Vehicle, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
export type CreateMaintenanceLogData = Omit<MaintenanceLog, 'id' | 'createdAt'>;
