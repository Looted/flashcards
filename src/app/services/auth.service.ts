import { Injectable, inject, signal, computed, PLATFORM_ID, isDevMode } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { MigrationService } from './migration.service';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly firestoreService = inject(FirestoreService);
  private readonly migrationService = inject(MigrationService);

  // Reactive signals for auth state
  private _currentUser = signal<User | null>(null);
  private _authStatus = signal<AuthStatus>('loading');
  private _isMigrating = signal(false);
  private _userProfileReady = signal(false);

  // Public signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly authStatus = this._authStatus.asReadonly();
  readonly isMigrating = this._isMigrating.asReadonly();
  readonly userProfileReady = this._userProfileReady.asReadonly();

  // Computed signals for convenience
  readonly isAuthenticated = computed(() => this._authStatus() === 'authenticated');
  readonly isGuest = computed(() => this._authStatus() === 'guest');
  readonly isLoading = computed(() => this._authStatus() === 'loading');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthStateListener();
      // Expose for E2E testing
      if (isDevMode()) {
        (window as any).authService = this;
      }
    }
  }

  private initializeAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this._currentUser.set(user);
      this._authStatus.set(user ? 'authenticated' : 'guest');
      this._userProfileReady.set(false); // Reset profile ready state

      // Handle migration when user logs in
      if (user) {
        await this.handleUserLogin(user);
        this._userProfileReady.set(true); // Profile ready after login handling
      } else {
        this._userProfileReady.set(true); // Profile ready immediately for guest users
      }
    });
  }

  private async handleUserLogin(user: User): Promise<void> {
    try {
      // Ensure user profile exists in Firestore
      await this.firestoreService.ensureUserExists(user.uid, {
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined
      });

      // Check if migration is needed
      const userProfile = await this.firestoreService.getUserProfile(user.uid);
      if (!userProfile?.hasMigratedLocalData && this.migrationService.hasLocalDataToMigrate()) {
        this._isMigrating.set(true);
        try {
          await this.migrationService.migrateGuestDataToUser(user.uid);
          // Clear local data after successful migration
          this.migrationService.clearMigratedLocalData();
          console.log('Migration completed and local data cleared');
        } catch (error) {
          console.error('Migration failed:', error);
          // Don't clear local data if migration failed - user can try again
        } finally {
          this._isMigrating.set(false);
        }
      }
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<void> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Utility method to get user display info
  getUserDisplayInfo() {
    const user = this.currentUser();
    if (!user) return null;

    return {
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid
    };
  }
}
