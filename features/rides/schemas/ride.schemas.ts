import { z } from 'zod';

export const createRideSchema = z.object({
  requestedBy: z.string().min(1),
  requestedByType: z.enum(['resident', 'staff']),
  scheduledAt: z.string().or(z.date()),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  dropoffAddress: z.string().min(1, 'Dropoff address is required'),
  purpose: z.string().optional(),
  passengerIds: z.array(z.string()).default([]),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  status: z.enum(['requested', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled']).default('requested'),
  notes: z.string().optional(),
});

export const updateRideSchema = createRideSchema.partial();

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type UpdateRideInput = z.infer<typeof updateRideSchema>;
