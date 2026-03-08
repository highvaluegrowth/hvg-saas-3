import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { QAFeedback, QAFeedbackStatus } from '../types/qa.types';

export const qaService = {
    async submitQAFeedback(payload: Omit<QAFeedback, 'id' | 'createdAt' | 'status'>): Promise<string> {
        try {
            const qaRef = collection(db, 'qa_feedback');

            // Firestore rejects undefined values, so we filter them out
            const cleanedPayload = Object.fromEntries(
                Object.entries(payload).filter((entry) => entry[1] !== undefined)
            );

            const payloadToSave = {
                ...cleanedPayload,
                status: 'open' as QAFeedbackStatus,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(qaRef, payloadToSave);
            return docRef.id;
        } catch (error: unknown) {
            console.error('Error submitting QA feedback:', error);
            throw new Error((error as Error)?.message || 'Failed to submit QA feedback');
        }
    },

    async getAllQAFeedback(): Promise<QAFeedback[]> {
        try {
            const qaRef = collection(db, 'qa_feedback');
            const q = query(qaRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();

                let createdAtVal = '';
                if (data.createdAt instanceof Timestamp) {
                    // Convert the Firestore Timestamp to a standard JavaScript Date object
                    createdAtVal = data.createdAt.toDate().toISOString();
                } else if (data.createdAt && typeof data.createdAt === 'string') {
                    createdAtVal = data.createdAt;
                } else if (data.createdAt && data.createdAt.toDate) {
                    createdAtVal = data.createdAt.toDate().toISOString();
                } else if (data.createdAt) {
                    // Best effort fallback
                    createdAtVal = new Date(data.createdAt).toISOString();
                } else {
                    createdAtVal = new Date().toISOString();
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    createdAt: createdAtVal,
                } as QAFeedback;
            });
        } catch (error) {
            console.error('Error fetching QA feedback:', error);
            throw new Error('Failed to fetch QA feedback');
        }
    },

    async updateQAFeedbackStatus(feedbackId: string, newStatus: QAFeedbackStatus): Promise<void> {
        try {
            const docRef = doc(db, 'qa_feedback', feedbackId);
            await updateDoc(docRef, { status: newStatus });
        } catch (error) {
            console.error('Error updating QA feedback status:', error);
            throw new Error('Failed to update QA feedback status');
        }
    }
};
