import type {
  FaithProfile,
  SobrietyStatus,
  SubstanceEntry,
  Goal,
  Capabilities,
  MoralResponse,
} from './profile';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  residentId?: string | null;          // linked clinical record
  tenantIds?: string[];                // orgs this user belongs to/manages
  preferences?: string[];              // selections from omni-onboarding personalization

  // Profile builder fields (set during onboarding profile-builder screens)
  faith?: FaithProfile;
  sobrietyStatus?: SobrietyStatus;
  sobrietyCleanSince?: string | null;  // ISO date — set when status = 'recovery'
  substances?: SubstanceEntry[];
  goals?: Goal[];
  capabilities?: Capabilities;
  morals?: MoralResponse[];
  profileComplete?: boolean;           // true after completing all profile-builder steps

  sobrietyDate?: Date | null;          // legacy — keep for backward compat
  recoveryGoals?: string[];            // legacy — keep for backward compat
  notificationPreferences: {
    events: boolean;
    chores: boolean;
    rides: boolean;
    messages: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

