import { adminDb } from '@/lib/firebase/admin';

export async function getCourseContextForAI(tenantId: string, userId: string): Promise<string> {
    let contextStr = "User Course Progress & Deadlines:\n";

    try {
        // 1. Fetch user enrollments
        const enrollmentsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('enrollments')
            .where('userId', '==', userId)
            .get();

        if (enrollmentsSnap.empty) {
            return "The user is not currently enrolled in any LMS courses.";
        }

        const enrollments = enrollmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Map through enrollments to get the related Course data
        for (const enrollment of enrollments) {
            // Assume courses are globally readable
            const courseDoc = await adminDb.collection('courses').doc(enrollment.courseId).get();
            if (courseDoc.exists) {
                const course = courseDoc.data();
                contextStr += `- Course: ${course?.title}\n`;
                contextStr += `  Status: ${enrollment.status}\n`;
                contextStr += `  Progress: ${enrollment.progress}%\n`;

                // In a real app we would join Due Dates from a subcollection
                if (enrollment.dueDate) {
                    contextStr += `  Next Deadline: ${new Date(enrollment.dueDate.toDate()).toLocaleDateString()}\n`;
                }
            }
        }

        return contextStr;

    } catch (err) {
        console.error("Error fetching AI course context:", err);
        return "Course context currently unavailable.";
    }
}
