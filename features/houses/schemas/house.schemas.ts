import { z } from 'zod';

export const HouseAddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
});

export const CreateHouseSchema = z.object({
  name: z.string().min(1, 'House name is required'),
  address: HouseAddressSchema,
  phone: z.string().optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  managerId: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const UpdateHouseSchema = CreateHouseSchema.partial();

export const CreateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

export const UpdateRoomSchema = CreateRoomSchema.partial();

export const CreateBedSchema = z.object({
  label: z.string().min(1, 'Bed label is required'),
});

export const UpdateBedSchema = z.object({
  label: z.string().min(1).optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'unavailable']).optional(),
  residentId: z.string().nullable().optional(),
});

export type CreateHouseInput = z.infer<typeof CreateHouseSchema>;
export type UpdateHouseInput = z.infer<typeof UpdateHouseSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;
export type CreateBedInput = z.infer<typeof CreateBedSchema>;
export type UpdateBedInput = z.infer<typeof UpdateBedSchema>;
