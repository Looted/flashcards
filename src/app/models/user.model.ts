import { Timestamp } from '@angular/fire/firestore';

export type LanguageCode = 'pl' | 'es' | 'en' | 'fr' | 'de' | 'it'; // Expanding for potential future use or stricter typing if needed, keeping simple for now based on current usage 'pl' | 'es'

export interface UserSettings {
  nativeLanguage: 'pl' | 'es' | 'en' | 'fr' | 'de' | 'it';
  themeMode: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  uid?: string; // Optional, useful when passing around
  email: string;
  photoURL?: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  hasMigratedLocalData: boolean;
  settings: UserSettings;
  schemaVersion?: number; // For schema migrations
}
