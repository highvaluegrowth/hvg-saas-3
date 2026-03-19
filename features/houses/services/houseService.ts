import { adminDb } from '@/lib/firebase/admin';
import { BaseRepository } from '@/lib/firestore';
import { House, Room, Bed, BedStatus } from '../types/house.types';
import type { CreateHouseInput, CreateRoomInput, CreateBedInput } from '../schemas/house.schemas';

class HouseService extends BaseRepository<House> {
  constructor(private tenantId: string) {
    super(adminDb, `tenants/${tenantId}/houses`);
  }

  async createHouse(input: CreateHouseInput): Promise<House> {
    return this.create({
      ...input,
      managerId: input.managerId ?? null,
      status: input.status ?? 'active',
    });
  }

  async updateHouse(houseId: string, input: Partial<CreateHouseInput>): Promise<void> {
    return this.update(houseId, input);
  }

  // Rooms
  private roomsPath(houseId: string) {
    return `tenants/${this.tenantId}/houses/${houseId}/rooms`;
  }

  async getRooms(houseId: string): Promise<Room[]> {
    const snapshot = await adminDb.collection(this.roomsPath(houseId)).get();
    return snapshot.docs.map((doc) => {
      const { id: _id, ...data } = doc.data();
      return { id: doc.id, ...data } as Room;
    });
  }

  async createRoom(houseId: string, input: CreateRoomInput): Promise<Room> {
    const now = new Date();
    const docRef = adminDb.collection(this.roomsPath(houseId)).doc();
    await docRef.set({
      houseId,
      name: input.name,
      capacity: input.capacity,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      houseId,
      name: input.name,
      capacity: input.capacity,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateRoom(houseId: string, roomId: string, input: Partial<CreateRoomInput>): Promise<void> {
    await adminDb.collection(this.roomsPath(houseId)).doc(roomId).update({
      ...input,
      updatedAt: new Date(),
    });
  }

  async deleteRoom(houseId: string, roomId: string): Promise<void> {
    await adminDb.collection(this.roomsPath(houseId)).doc(roomId).delete();
  }

  async deleteBed(houseId: string, roomId: string, bedId: string): Promise<void> {
    await adminDb.collection(this.bedsPath(houseId, roomId)).doc(bedId).delete();
  }

  // Beds
  private bedsPath(houseId: string, roomId: string) {
    return `tenants/${this.tenantId}/houses/${houseId}/rooms/${roomId}/beds`;
  }

  async getBeds(houseId: string, roomId: string): Promise<Bed[]> {
    const snapshot = await adminDb.collection(this.bedsPath(houseId, roomId)).get();
    return snapshot.docs.map((doc) => {
      const { id: _id, ...data } = doc.data();
      return { id: doc.id, ...data } as Bed;
    });
  }

  async createBed(houseId: string, roomId: string, input: CreateBedInput): Promise<Bed> {
    const now = new Date();
    const docRef = adminDb.collection(this.bedsPath(houseId, roomId)).doc();
    await docRef.set({
      houseId,
      roomId,
      label: input.label,
      status: 'available' as BedStatus,
      residentId: null,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      houseId,
      roomId,
      label: input.label,
      status: 'available' as BedStatus,
      residentId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateBed(
    houseId: string,
    roomId: string,
    bedId: string,
    data: { status?: BedStatus; residentId?: string | null; label?: string }
  ): Promise<void> {
    await adminDb.collection(this.bedsPath(houseId, roomId)).doc(bedId).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async assignResident(
    houseId: string,
    roomId: string,
    bedId: string,
    residentId: string
  ): Promise<void> {
    const now = new Date();
    const batch = adminDb.batch();

    // Update the new bed to occupied
    const bedRef = adminDb.collection(this.bedsPath(houseId, roomId)).doc(bedId);
    batch.update(bedRef, { residentId, status: 'occupied', updatedAt: now });

    // Find the resident's active enrollment
    const enrollmentSnap = await adminDb
      .collection(`tenants/${this.tenantId}/enrollments`)
      .where('residentId', '==', residentId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!enrollmentSnap.empty) {
      const enrollmentDoc = enrollmentSnap.docs[0];
      const prev = enrollmentDoc.data();

      // If previously assigned to a different bed, clear it
      if (prev.bedId && (prev.bedId !== bedId || prev.roomId !== roomId || prev.houseId !== houseId)) {
        const oldBedRef = adminDb
          .collection(`tenants/${this.tenantId}/houses/${prev.houseId}/rooms/${prev.roomId}/beds`)
          .doc(prev.bedId);
        batch.update(oldBedRef, { residentId: null, status: 'available', updatedAt: now });
      }

      batch.update(enrollmentDoc.ref, { houseId, roomId, bedId, updatedAt: now });
    }

    await batch.commit();
  }

  async unassignResident(houseId: string, roomId: string, bedId: string): Promise<void> {
    const now = new Date();

    // Read the bed first to get the residentId
    const bedRef = adminDb.collection(this.bedsPath(houseId, roomId)).doc(bedId);
    const bedSnap = await bedRef.get();
    const residentId = bedSnap.data()?.residentId as string | null;

    const batch = adminDb.batch();
    batch.update(bedRef, { residentId: null, status: 'available', updatedAt: now });

    if (residentId) {
      const enrollmentSnap = await adminDb
        .collection(`tenants/${this.tenantId}/enrollments`)
        .where('residentId', '==', residentId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!enrollmentSnap.empty) {
        batch.update(enrollmentSnap.docs[0].ref, {
          houseId: null,
          roomId: null,
          bedId: null,
          updatedAt: now,
        });
      }
    }

    await batch.commit();
  }
}

export function createHouseService(tenantId: string): HouseService {
  return new HouseService(tenantId);
}
