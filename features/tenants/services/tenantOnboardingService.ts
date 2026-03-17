import { adminDb as db } from '@/lib/firebase/admin';

export const tenantOnboardingService = {
    /**
     * Seed a new tenant with default data and onboarding checklist
     */
    async seedTenant(tenantId: string, adminUid: string) {
        const batch = db.batch();
        const now = new Date().toISOString();

        // 1. Default Contract Template
        const contractRef = db.collection('tenants').doc(tenantId).collection('contractTemplates').doc('default');
        batch.set(contractRef, {
            title: 'Resident Intake Agreement',
            content: '<h1>Resident Intake Agreement</h1><p>This is a default agreement. Please edit this in settings.</p>',
            createdAt: now,
            updatedAt: now,
        });

        // 2. Onboarding Checklist
        const onboardingRef = db.collection('tenants').doc(tenantId).collection('onboarding').doc('checklist');
        batch.set(onboardingRef, {
            items: [
                { id: 'house', title: 'Setup first house', description: 'Create your first sober living house and define its capacity.', status: 'pending' },
                { id: 'course', title: 'Setup first course', description: 'Create a "Welcome" or "House Rules" course for residents.', status: 'pending' },
                { id: 'event', title: 'Setup first event', description: 'Schedule a house meeting or group session.', status: 'pending' },
                { id: 'stripe', title: 'Connect Stripe account', description: 'Enable payments for bed fees and deposits.', status: 'pending' },
                { id: 'facebook', title: 'Connect Facebook', description: 'Link your social media for automated updates.', status: 'pending' },
                { id: 'resident', title: 'Enroll first Resident', description: 'Admit an applicant to your first house.', status: 'pending' },
                { id: 'blog', title: 'Publish first blog post', description: 'Share your first recovery update.', status: 'pending' },
            ],
            updatedAt: now,
        });

        await batch.commit();
    }
};
