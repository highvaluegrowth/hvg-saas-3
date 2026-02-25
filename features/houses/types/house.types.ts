import { BaseDocument } from '@/lib/firestore/types';

export interface HouseAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface House extends BaseDocument {
  name: string;
  address: HouseAddress;
  phone?: string;
  capacity: number;
  managerId: string | null;
  status: 'active' | 'inactive';
}

export interface Room extends BaseDocument {
  houseId: string;
  name: string;
  capacity: number;
}

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'unavailable';

export interface Bed extends BaseDocument {
  houseId: string;
  roomId: string;
  label: string;
  status: BedStatus;
  residentId: string | null;
}

export interface CreateHouseInput {
  name: string;
  address: HouseAddress;
  phone?: string;
  capacity: number;
  managerId?: string | null;
  status?: 'active' | 'inactive';
}

export interface CreateRoomInput {
  name: string;
  capacity: number;
}

export interface CreateBedInput {
  label: string;
}
