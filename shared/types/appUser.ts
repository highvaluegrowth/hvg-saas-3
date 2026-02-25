export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  residentId?: string | null;          // linked clinical record
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
