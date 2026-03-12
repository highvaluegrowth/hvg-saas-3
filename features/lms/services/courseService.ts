// features/lms/services/courseService.ts
// Admin SDK service for LMS courses

import { adminDb } from '@/lib/firebase/admin';

export interface CurriculumLesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';
  order: number;
}

export interface CurriculumModule {
  id: string;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

export interface CourseDoc {
  id: string;
  ownerTenantId: string;
  title: string;
  description: string;
  visibility: 'tenant' | 'universal';
  published: boolean;
  curriculum: CurriculumModule[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function coursesRef(tenantId: string) {
  return adminDb.collection('tenants').doc(tenantId).collection('courses');
}

export const courseService = {
  async create(tenantId: string, uid: string, payload: { title: string; description: string; visibility: 'tenant' | 'universal' }): Promise<CourseDoc> {
    const now = new Date().toISOString();
    const docRef = coursesRef(tenantId).doc();
    const course: CourseDoc = {
      id: docRef.id,
      ownerTenantId: tenantId,
      title: payload.title,
      description: payload.description,
      visibility: payload.visibility,
      published: false,
      curriculum: [],
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(course);
    return course;
  },

  async list(tenantId: string): Promise<CourseDoc[]> {
    const snap = await coursesRef(tenantId).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => d.data() as CourseDoc);
  },

  async get(tenantId: string, courseId: string): Promise<CourseDoc | null> {
    const doc = await coursesRef(tenantId).doc(courseId).get();
    if (!doc.exists) return null;
    return doc.data() as CourseDoc;
  },

  async saveCurriculum(tenantId: string, courseId: string, curriculum: CurriculumModule[]): Promise<void> {
    await coursesRef(tenantId).doc(courseId).update({
      curriculum,
      updatedAt: new Date().toISOString(),
    });
  },

  async update(tenantId: string, courseId: string, updates: Partial<Pick<CourseDoc, 'title' | 'description' | 'visibility' | 'published'>>): Promise<void> {
    await coursesRef(tenantId).doc(courseId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(tenantId: string, courseId: string): Promise<void> {
    await coursesRef(tenantId).doc(courseId).delete();
  },
};
