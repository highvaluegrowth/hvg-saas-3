import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const CreateVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(currentYear + 1),
  color: z.string().min(1, 'Color is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().optional(),
  seats: z.coerce.number().int().min(1).max(50),
  wheelchairAccessible: z.boolean().default(false),
  insurance: z.object({
    provider: z.string().min(1, 'Insurance provider is required'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    expiresAt: z.coerce.date(),
  }),
  registration: z.object({
    expiresAt: z.coerce.date(),
  }),
  currentMileage: z.coerce.number().int().min(0),
  status: z.enum(['active', 'maintenance', 'retired']).default('active'),
  approvedDriverIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export const CreateMaintenanceLogSchema = z.object({
  date: z.coerce.date(),
  mileage: z.coerce.number().int().min(0),
  type: z.enum(['oil_change', 'tire', 'inspection', 'repair', 'other']),
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().min(0).optional(),
  performedBy: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type CreateMaintenanceLogInput = z.infer<typeof CreateMaintenanceLogSchema>;
