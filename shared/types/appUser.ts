export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  residentId?: string | null;          // linked clinical record
  tenantIds?: string[];                // orgs this user belongs to/manages (for Operators)
  preferences?: string[];              // selections from omni-onboarding questionnaire
  sobrietyDate?: Date | null;
  recoveryGoals?: string[];
  notificationPreferences: {
    events: boolean;
    chores: boolean;
    rides: boolean;
    messages: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
