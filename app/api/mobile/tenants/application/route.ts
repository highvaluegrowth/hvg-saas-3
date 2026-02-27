import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/middleware/authMiddleware';
import { appUserService } from '@/features/appUser/services/appUserService';

export async function POST(request: NextRequest) {
    try {
        const token = await verifyAuthToken(request);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const uid = token.uid;
        const user = await appUserService.getByUid(uid);
        if (!user) return NextResponse.json({ error: 'AppUser not found' }, { status: 404 });

        // Ensure the user actually selected 'manage_house' preference
        if (!user.preferences?.includes('manage_house')) {
            return NextResponse.json({ error: 'Must have manage_house preference' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const reqName = body.name || 'Draft Application';
        const rawSlug = reqName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${rawSlug}-${Math.random().toString(36).substring(2, 7)}`;

        const newDoc = adminDb.collection('tenants').doc();
        const applicationId = newDoc.id;

        await newDoc.set({
            name: reqName,
            slug: slug,
            status: 'pending', // Use pending to trigger the banner or use 'draft' if we want them to finish the wizard. Let's start with draft.
            ownerId: uid,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Track their preferences for addendums
            applicationPreferences: user.preferences,
            settings: {
                theme: { primaryColor: '#000000', logoUrl: '' },
                features: {
                    choresEnabled: true,
                    eventsEnabled: true,
                    ridesEnabled: false,
                    lmsEnabled: false,
                    incidentsEnabled: true,
                },
            }
        });

        return NextResponse.json({ applicationId });

    } catch (error) {
        console.error('Failed scaffolding tenant application', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
