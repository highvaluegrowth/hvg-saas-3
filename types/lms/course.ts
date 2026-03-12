import { Timestamp } from 'firebase/firestore';

export type QuestionType =
    | 'MULTIPLE_CHOICE'
    | 'TRUE_FALSE'
    | 'SHORT_ANSWER'
    | 'LONG_ANSWER'
    | 'FILL_BLANK'
    | 'LIKERT_SCALE'
    | 'MATCHING'
    | 'ORDERING'
    | 'RATING'
    | 'IMAGE_CHOICE';

export interface QuizQuestion {
    id: string;
    type: QuestionType;
    questionText: string; // TipTap HTML or JSON
    points: number;
    options?: string[]; // For SELECT type questions
    correctAnswer?: string | number | string[];
    metadata?: Record<string, unknown>; // Extra data like hotspot coordinates
}

export interface Lesson {
    id: string;
    courseId: string;
    moduleId: string;
    title: string;
    description?: string;
    order: number;
    type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SLIDES';
    requiredPhase?: number; // Phase required to access this lesson
    content?: string; // TipTap HTML or JSON for TEXT lessons
    muxPlaybackId?: string; // For VIDEO
    questions?: QuizQuestion[]; // Inline quiz questions if type === 'QUIZ'
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Module {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type PostCompletionActionType = 'NOTIFY_STAFF' | 'PHASE_PROMOTE' | 'AWARD_BADGE';

export interface PostCompletionAction {
    type: PostCompletionActionType;
    metadata?: Record<string, unknown>;
}

export interface Course {
    id: string;
    ownerTenantId: string; // 'system' or specific tenant ID
    title: string;
    description: string;
    thumbnailUrl?: string;
    visibility: 'tenant' | 'universal'; // 'universal' = accessible by non-residents
    published: boolean;
    completionCriteria: {
        type: 'ALL_LESSONS_AND_QUIZZES' | 'MIN_SCORE' | 'WATCH_TIME';
        minValue?: number; // e.g., 80 for 80% score
    };
    postCompletionActions: PostCompletionAction[];
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number; // 0-100 percentage
    completedLessons: string[]; // Lesson IDs
    quizScores: Record<string, number>; // LessonID -> Score
    enrolledAt: Timestamp;
    lastAccessedAt: Timestamp;
    completedAt?: Timestamp;
}
