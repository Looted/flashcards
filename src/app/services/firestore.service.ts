import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { UserProfile } from '../models/user.model';
import { UserProgress } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private readonly db = inject(Firestore);

  // User profile operations
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      const defaultProfile: UserProfile = {
        email: userData.email || '',
        photoURL: userData.photoURL,
        displayName: userData.displayName,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        hasMigratedLocalData: false,
        settings: {
          nativeLanguage: 'pl',
          themeMode: 'system'
        },
        schemaVersion: 0 // Default to 0, migration service will upgrade if needed
      };

      await setDoc(userDocRef, { ...defaultProfile, ...userData });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateUserSettings(uid: string, settings: Partial<UserProfile['settings']>): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, {
        'settings': settings,
        lastLogin: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async markMigrationComplete(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, {
        hasMigratedLocalData: true,
        lastLogin: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking migration complete:', error);
      throw error;
    }
  }

  // User progress operations
  async getUserProgress(uid: string): Promise<UserProgress | null> {
    try {
      const progressDoc = await getDoc(doc(this.db, 'users', uid, 'progress', 'vocabulary'));
      if (progressDoc.exists()) {
        return progressDoc.data() as UserProgress;
      }
      return null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async saveUserProgress(uid: string, stats: Record<string, any>): Promise<void> {
    try {
      const progressDocRef = doc(this.db, 'users', uid, 'progress', 'vocabulary');
      const progressData: UserProgress = {
        stats,
        updatedAt: Timestamp.now()
      };

      await setDoc(progressDocRef, progressData);
    } catch (error) {
      console.error('Error saving user progress:', error);
      throw error;
    }
  }

  // Utility methods
  async ensureUserExists(uid: string, userInfo: { email: string; displayName?: string; photoURL?: string }): Promise<void> {
    const existingProfile = await this.getUserProfile(uid);
    if (!existingProfile) {
      await this.createUserProfile(uid, userInfo);
    } else {
      // Update last login
      await this.updateUserProfile(uid, { lastLogin: Timestamp.now() });
    }
  }
}
