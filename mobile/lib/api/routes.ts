import { api } from './client';
import type { AppUser } from '@shared/types/appUser';

// --- Auth ---
export const authApi = {
  register: (body: { email: string; password: string; displayName: string }) =>
    api.post<{ uid: string; appUser: AppUser }>('/api/mobile/auth/register', body, false),
  /** Call after Google Sign-In to JIT-provision AppUser + resident claim */
  loginWithGoogle: () =>
    api.post<{ uid: string; appUser: AppUser }>('/api/mobile/auth/google', {}),
};

// --- User profile ---
export const userApi = {
  getMe: () => api.get<{ user: AppUser }>('/api/mobile/users/me'),
  updateMe: (body: Partial<AppUser>) => api.patch<{ success: boolean }>('/api/mobile/users/me', body),
  getEnrollments: () => api.get<{ enrollments: Enrollment[] }>('/api/mobile/users/me/enrollments'),
  getFeed: () => api.get<{ events: FeedEvent[]; chores: FeedChore[] }>('/api/mobile/users/me/feed'),
  getProgress: () => api.get<ProgressData>('/api/mobile/users/me/progress'),
};

// --- LMS ---
export const lmsApi = {
  getCourses: (tenantId: string) =>
    api.get<{ courses: MobileCourse[] }>(`/api/mobile/tenants/${tenantId}/courses`),
  getCourse: (tenantId: string, courseId: string) =>
    api.get<{ course: MobileCourseDetail }>(`/api/mobile/tenants/${tenantId}/courses/${courseId}`),
  enroll: (tenantId: string, courseId: string) =>
    api.post<{ success: boolean }>(`/api/mobile/tenants/${tenantId}/courses/${courseId}/enroll`, {}),
  completeLesson: (tenantId: string, courseId: string, lessonId: string) =>
    api.post<{ success: boolean }>(
      `/api/mobile/tenants/${tenantId}/courses/${courseId}/lessons/${lessonId}/complete`,
      {}
    ),
};

// --- Tenants ---
export const tenantApi = {
  list: (tag?: string) => api.get<{ tenants: PublicTenant[] }>(`/api/mobile/tenants${tag ? `?tag=${tag}` : ''}`),
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
  getHouses: (tenantId: string) =>
    api.get<{ houses: TenantHouse[] }>(`/api/mobile/tenants/${tenantId}/houses`),
};

// --- Search ---
export const searchApi = {
  getHousesWithinRadius: (lat: number, lng: number, radiusInKm: number) =>
    api.get<{ houses: any[] }>(`/api/mobile/search/houses?lat=${lat}&lng=${lng}&radius=${radiusInKm}`),
};

// --- AI Chat ---
export const chatApi = {
  send: (body: { message: string; conversationId?: string; systemContext?: string }) =>
    api.post<{
      reply: string;
      conversationId: string;
      component?: string;
      componentData?: unknown;
    }>('/api/ai/mobile/chat', body),
  getHistory: (conversationId?: string) => {
    const qs = conversationId ? `?conversationId=${conversationId}` : '';
    return api.get<{ messages?: ChatMessage[]; conversations?: { id: string; updatedAt: string }[] }>(
      `/api/ai/mobile/chat/history${qs}`
    );
  },
};

// --- Applications ---
export const applicationApi = {
  submitBed: (body: Record<string, unknown>) =>
    api.post<{ id: string; success: boolean }>('/api/applications/bed', body),
  submitStaff: (body: Record<string, unknown>) =>
    api.post<{ id: string; success: boolean }>('/api/applications/staff', body),
  getUserApplications: () =>
    api.get<{ applications: Record<string, unknown>[] }>('/api/applications/user'),
};

// --- Inbox & Messaging ---
export const inboxApi = {
  getChats: () => api.get<{ chats: Chat[] }>('/api/mobile/inbox/chats'),
  getMessages: (chatId: string) => api.get<{ messages: ChatMessage[] }>(`/api/mobile/inbox/chats/${chatId}/messages`),
  sendMessage: (chatId: string, content: string, type: 'text' | 'image' = 'text') => 
    api.post<{ success: boolean; message: ChatMessage }>(`/api/mobile/inbox/chats/${chatId}/messages`, { content, type }),
  getParticipants: (chatId: string) => api.get<{ participants: ChatParticipantProfile[] }>(`/api/mobile/inbox/chats/${chatId}/participants`),
};

// --- Local types (mobile-specific response shapes) ---
export type { Chat, ChatMessage, ChatParticipantProfile } from '@shared/types/chat';

export interface PublicTenant {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string;
  logoURL?: string;
  tags?: string[];
}

export interface TenantHouse {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  phone?: string | null;
  capacity: number;
  status: string;
  managerId?: string | null;
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
  /** Rich card type returned by AI tool calls (e.g. 'sobriety_stats', 'crisis_resources') */
  component?: string;
  /** Tool result data used to render the rich card */
  componentData?: unknown;
}

export interface MobileCourse {
  id: string;
  title: string;
  description: string;
  totalLessons: number;
  moduleCount: number;
  enrolled: boolean;
  progress: number; // 0-100
  enrollmentStatus: string | null;
  completedLessons: number;
}

export interface MobileLessonContent {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';
  order: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  content?: string;
  questions?: unknown[];
  slides?: { id: string; imageUrl: string; caption?: string }[];
}

export interface MobileCourseModule {
  id: string;
  title: string;
  order: number;
  lessons: MobileLessonContent[];
}

export interface MobileCourseDetail {
  id: string;
  title: string;
  description: string;
  modules: MobileCourseModule[];
}

export interface CourseProgress {
  courseId: string;
  title: string;
  progress: number; // 0-100
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  completedLessons: number;
  totalLessons: number;
}

export interface MoodEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  score: number; // 1-5
}

export interface ProgressData {
  sobriety: {
    days: number;
    startDate: string | null;
    nextMilestone: number; // days until next milestone
    nextMilestoneDays: number; // what the milestone is (30, 60, 90, 180, 365...)
  };
  courses: {
    enrolled: number;
    completed: number;
    inProgress: number;
    items: CourseProgress[];
  };
  meetings: {
    thisMonth: number;
    streak: number; // consecutive weeks with at least 1 meeting
  };
  moods: MoodEntry[]; // last 7 entries
}

// --- Houses ---
export const houseApi = {
  houseDetail: (houseId: string, tenantId: string) =>
    api.get<{ house: HouseDetail }>(`/api/mobile/houses/${houseId}?tenantId=${tenantId}`),
  listAll: () =>
    api.get<{ houses: GlobalHouse[] }>('/api/mobile/houses'),
};

export interface GlobalHouse {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  address?: { street?: string; city?: string; state?: string; zip?: string } | null;
  city?: string | null;
  state?: string | null;
  capacity: number;
  status: string;
}

export interface HouseDetail {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  amenities?: string[];
  rules?: string[];
  capacity?: number;
  availableBeds?: number;
  imageUrl?: string;
  tenantId?: string;
}

export interface UniversalCourse {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  totalLessons: number;
  moduleCount: number;
  visibility: 'tenant' | 'universal';
}

export const courseApi = {
  listUniversal: () =>
    api.get<{ courses: UniversalCourse[] }>('/api/mobile/courses'),
};

export interface UniversalEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  location?: string;
  type?: string;
  visibility: 'universal';
}

export const eventsApi = {
  listUniversal: () =>
    api.get<{ events: UniversalEvent[] }>('/api/mobile/events'),
};
