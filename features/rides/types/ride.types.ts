export type RideStatus = 'requested' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Ride {
  id: string;
  tenantId: string;
  requestedBy: string;        // userId (staff or resident)
  requestedByType: 'resident' | 'staff';
  scheduledAt: Date;
  pickupAddress: string;
  dropoffAddress: string;
  purpose?: string;
  passengerIds: string[];     // resident IDs
  vehicleId?: string;
  driverId?: string;
  status: RideStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRideData = Omit<Ride, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRideData = Partial<Omit<Ride, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
