import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { QaFeedback } from '../types/qa.types';

export const qaService = {
    /**
     * Submit a new visual QA feedback
     */
    async submitFeedback(feedbackData: Omit<QaFeedback, 'id' | 'createdAt' | 'status'> & { status?: string }) {
        try {
            const qaRef = collection(db, 'qa_feedback');

            const payload = {
                ...feedbackData,
                status: feedbackData.status || 'open',
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(qaRef, payload);
            return { id: docRef.id, ...payload };
        } catch (error) {
            console.error('Error submitting QA feedback:', error);
            throw new Error('Failed to submit QA feedback');
        }
    }
};
