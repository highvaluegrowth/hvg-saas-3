export type ApplicationType = 'tenant' | 'bed' | 'staff' | 'course' | 'event';
export type ApplicationStatus = 'draft' | 'pending' | 'assigned' | 'accepted' | 'rejected' | 'archived';

export interface BaseApplication {
    id: string;
    type: ApplicationType;
    status: ApplicationStatus;
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
    zipCode: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
    assignedTenantId?: string;
    assignedAt?: string;
    notes?: string;
}

export interface BedApplication extends BaseApplication {
    type: 'bed';
    data: {
        phone: string;
        sobrietyDate?: string;
        substanceHistory: string;
        goals: string;
        fundingSource: string;
        gender: string;
        genderPreference?: string;
        references: Array<{ name: string; phone: string; relationship: string }>;
        accessibilityNeeds?: string;
    };
}

export interface StaffApplication extends BaseApplication {
    type: 'staff';
    data: {
        phone: string;
        positionType: string;
        certifications: string[];
        yearsExperience: number;
        experienceSummary: string;
        references: Array<{ name: string; phone: string; relationship: string }>;
        resumeUrl?: string;
        availability: string;
    };
}

export interface CourseApplication extends BaseApplication {
    type: 'course';
    data: {
        courseId: string;
        courseName: string;
        tenantId: string;
        schedulingPreference?: string;
        accessibilityNeeds?: string;
    };
}

export interface EventApplication extends BaseApplication {
    type: 'event';
    data: {
        eventId: string;
        eventName: string;
        tenantId: string;
        dietaryRequirements?: string;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
        accessibilityNeeds?: string;
    };
}

export type Application = BedApplication | StaffApplication | CourseApplication | EventApplication;

export interface TenantMatchScore {
    tenantId: string;
    tenantName: string;
    city: string;
    state: string;
    zipCode: string;
    score: number;
    specializationOverlap: number;
    hasCapacity: boolean;
    availableBeds?: number;
    specializations: string[];
}
