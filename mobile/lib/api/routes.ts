import { api } from './client';
import type { AppUser } from '@shared/types/appUser';

// --- Auth ---
export const authApi = {
  register: (body: { email: string; password: string; displayName: string }) =>
    api.post<{ uid: string; appUser: AppUser }>('/api/mobile/auth/register', body, false),
};

// --- User profile ---
export const userApi = {
  getMe: () => api.get<{ user: AppUser }>('/api/mobile/users/me'),
  updateMe: (body: Partial<AppUser>) => api.patch<{ success: boolean }>('/api/mobile/users/me', body),
  getEnrollments: () => api.get<{ enrollments: Enrollment[] }>('/api/mobile/users/me/enrollments'),
  getFeed: () => api.get<{ events: FeedEvent[]; chores: FeedChore[] }>('/api/mobile/users/me/feed'),
};

// --- Tenants ---
export const tenantApi = {
  list: () => api.get<{ tenants: PublicTenant[] }>('/api/mobile/tenants'),
  requestJoin: (tenantId: string, body: { message?: string }) =>
    api.post<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/request-join`, body),
  getEvents: (tenantId: string) =>
    api.get<{ events: MobileEvent[] }>(`/api/mobile/tenants/${tenantId}/events`),
  attendEvent: (tenantId: string, eventId: string) =>
    api.post<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/events/${eventId}/attend`, {}),
  unattendEvent: (tenantId: string, eventId: string) =>
    api.delete<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/events/${eventId}/attend`),
  getChores: (tenantId: string) =>
    api.get<{ chores: MobileChore[] }>(`/api/mobile/tenants/${tenantId}/chores`),
  updateChoreStatus: (tenantId: string, choreId: string, status: string) =>
    api.patch<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/chores/${choreId}/status`, { status }),
  getRides: (tenantId: string) =>
    api.get<{ rides: MobileRide[] }>(`/api/mobile/tenants/${tenantId}/rides`),
  requestRide: (tenantId: string, body: { destination: string; requestedAt: string; notes?: string }) =>
    api.post<{ rideId: string }>(`/api/mobile/tenants/${tenantId}/rides`, body),
};

// --- AI Chat ---
export const chatApi = {
  send: (body: { message: string; conversationId?: string }) =>
    api.post<{ reply: string; conversationId: string }>('/api/ai/mobile/chat', body),
  getHistory: (conversationId?: string) => {
    const qs = conversationId ? `?conversationId=${conversationId}` : '';
    return api.get<{ messages?: ChatMessage[]; conversations?: { id: string; updatedAt: string }[] }>(
      `/api/ai/mobile/chat/history${qs}`
    );
  },
};

// --- Local types (mobile-specific response shapes) ---
export interface PublicTenant {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string;
  logoURL?: string;
}

export interface Enrollment {
  id: string;
  tenantId: string;
  status: string;
  houseId?: string;
  phase?: number;
  moveInDate?: string;
}

export interface FeedEvent {
  id: string;
  tenantId: string;
  title: string;
  scheduledAt: string;
  location?: string;
  type?: string;
}

export interface FeedChore {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  dueDate?: string;
}

export interface MobileEvent {
  id: string;
  title: string;
  scheduledAt: string;
  duration?: number;
  location?: string;
  type?: string;
  attendeeCount: number;
}

export interface MobileChore {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
}

export interface MobileRide {
  id: string;
  destination: string;
  status: string;
  requestedAt: string;
  driverId?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
