// ─── Base User Profile ────────────────────────────────────────────────────────
// Global identity document stored at /users/{uid}.
// Decoupled from any single facility application so a user can apply to
// multiple tenants without duplicating their core demographic data.
export interface BaseUserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;                    // ISO date string e.g. "1990-04-15"
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Facility Application ─────────────────────────────────────────────────────
// Tenant-scoped document stored at /tenants/{tenantId}/applications/{appId}.
// Status MUST be 'pending_triage' on creation — enforced both here (TypeScript)
// and in Firestore security rules.
export type FacilityApplicationStatus =
  | 'pending_triage'
  | 'reviewing'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'archived';

export interface FacilityApplication {
  id: string;
  tenantId: string;
  // Identity snapshot (copied from BaseUserProfile at submission time)
  applicantId: string;
  applicantName: string;          // firstName + " " + lastName
  applicantEmail: string;
  applicantPhone?: string;
  // Status — must be 'pending_triage' at creation
  status: FacilityApplicationStatus;
  // Facility-specific clinical fields
  substanceHistory?: string;
  primarySubstance?: string;
  sobrietyDate?: string;
  matStatus?: boolean;
  matMedication?: string;
  injectionDrugUse?: boolean;
  // Funding
  fundingSource?: string;
  fundingSources?: string[];
  insuranceCarrier?: string;
  // Metadata
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  threadId?: string;
}

// Creation payload — TypeScript-enforces pending_triage at creation site
export type CreateFacilityApplicationInput = Omit<
  FacilityApplication,
  'id' | 'status' | 'createdAt' | 'updatedAt'
> & { status: 'pending_triage' };

// ─── Legacy global application types ─────────────────────────────────────────
export type ApplicationType = 'tenant' | 'bed' | 'staff' | 'course' | 'event';
export type ApplicationStatus = 'draft' | 'pending' | 'pending_triage' | 'assigned_to_tenant' | 'assigned' | 'reviewing' | 'accepted' | 'waitlisted' | 'rejected' | 'archived';

export interface BaseApplication {
    id: string;
    type: ApplicationType;
    status: ApplicationStatus;
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
    zipCode: string;
    tenantId: string | null;
    requestedTenantId: string | null;
    requestedHouseId: string | null;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
    assignedTenantId?: string;
    assignedAt?: string;
    notes?: string;
    threadId?: string;
}

export interface BedApplication extends BaseApplication {
    type: 'bed';
    data: {
        // Step 1 — Personal Info
        phone: string;
        dateOfBirth?: string;
        raceEthnicity?: string;
        // Step 2 — Recovery Profile
        sobrietyDate?: string;
        primarySubstance?: string;
        daysUsedPast30?: number;
        matStatus?: boolean;
        matMedication?: string;
        injectionDrugUse?: boolean;
        substanceHistory?: string;
        goals: string;
        // Step 3 — Funding & Insurance
        fundingSources?: string[];
        fundingSource?: string;           // legacy single-value — kept for backward compat
        insuranceDetails?: {
            carrier: string;
            memberId: string;
            groupNumber?: string;
            priorAuthStatus: 'Yes' | 'No' | 'In progress';
        };
        // Step 4 — Housing & Background
        currentHousing?: string;
        criminalJusticeSupervision?: boolean;
        supervisionType?: string;
        employmentStatus?: string;
        coOccurringDiagnosis?: boolean;
        emergencyContactName?: string;
        emergencyContactPhone?: string;
        emergencyContactRelationship?: string;
        // Step 5 — Preferences & References
        gender: string;
        genderPreference?: string;
        housePref?: string;
        accessibilityNeeds?: string;
        references: Array<{ name: string; phone: string; relationship: string }>;
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
    isSorEligible?: boolean;    // For SAMHSA/SOR grant matching
    distanceMiles?: number;     // Approximate distance
    financialMatch?: string;    // "Grant Eligible" | "Self-Pay" | etc.
}
