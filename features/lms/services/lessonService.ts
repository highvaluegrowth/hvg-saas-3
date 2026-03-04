// features/lms/services/lessonService.ts
import { adminDb } from '@/lib/firebase/admin';
import { QuizQuestion } from '@/types/lms/course';

export interface SlideItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface LessonDoc {
  id: string;
  courseId: string;
  tenantId: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';
  order: number;
  // VIDEO fields
  videoUrl?: string;
  thumbnailUrl?: string;
  // TEXT fields
  content?: string; // TipTap HTML
  // QUIZ fields
  questions?: QuizQuestion[];
  // SLIDES fields
  slides?: SlideItem[];
  createdAt: string;
  updatedAt: string;
}

function lessonsRef(tenantId: string, courseId: string) {
  return adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('courses')
    .doc(courseId)
    .collection('lessons');
}

export const lessonService = {
  async get(tenantId: string, courseId: string, lessonId: string): Promise<LessonDoc | null> {
    const doc = await lessonsRef(tenantId, courseId).doc(lessonId).get();
    if (!doc.exists) return null;
    return doc.data() as LessonDoc;
  },

  async upsert(tenantId: string, courseId: string, lessonId: string, data: Partial<LessonDoc>): Promise<LessonDoc> {
    const ref = lessonsRef(tenantId, courseId).doc(lessonId);
    const existing = await ref.get();
    const now = new Date().toISOString();
    if (!existing.exists) {
      const doc: LessonDoc = {
        id: lessonId,
        courseId,
        tenantId,
        title: data.title || '',
        type: data.type || 'TEXT',
        order: data.order || 0,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await ref.set(doc);
      return doc;
    } else {
      const updates = { ...data, updatedAt: now };
      await ref.update(updates);
      const updated = await ref.get();
      return updated.data() as LessonDoc;
    }
  },
};
