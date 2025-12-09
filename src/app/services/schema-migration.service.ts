import { Injectable, inject, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { MIGRATIONS } from '../migrations';
import { STORAGE_KEYS } from '../migrations/constants';

@Injectable({
  providedIn: 'root'
})
export class SchemaMigrationService {
  private readonly CURRENT_SCHEMA_VERSION = MIGRATIONS.length > 0
    ? Math.max(...MIGRATIONS.map(m => m.version))
    : 0;

  private readonly storageService = inject(StorageService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);

  constructor() {
    // Watch for auth changes to trigger Firestore migration
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.migrateFirestoreData(user.uid);
      }
    });
  }

  /**
   * Main entry point to check and run migrations
   */
  async checkAndMigrate(): Promise<void> {
    try {
      // Local migration is run explicitly.
      // Firestore migration is handled by the effect when auth state changes.
      await this.migrateLocalData();
    } catch (error) {
      console.error('Schema migration failed:', error);
      // We don't throw here to avoid blocking app startup,
      // but in critical scenarios we might want to.
    }
  }

  private async migrateFirestoreData(uid: string): Promise<void> {
    const profile = await this.firestoreService.getUserProfile(uid);
    if (!profile) return;

    const currentVersion = profile.schemaVersion || 0;

    if (currentVersion < this.CURRENT_SCHEMA_VERSION) {
      console.log(`Migrating Firestore data from v${currentVersion} to v${this.CURRENT_SCHEMA_VERSION}`);

      let migratedVersion = currentVersion;

      for (const migration of MIGRATIONS) {
        if (migration.version > currentVersion) {
            if (migration.migrateFirestore) {
                await migration.migrateFirestore(uid, this.firestoreService);
            }
            migratedVersion = migration.version;
        }
      }

      // Update version in profile
      await this.firestoreService.updateUserProfile(uid, { schemaVersion: migratedVersion });
      console.log(`Firestore migration to v${migratedVersion} complete`);
    }
  }

  private async migrateLocalData(): Promise<void> {
    const storedVersion = this.storageService.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (currentVersion < this.CURRENT_SCHEMA_VERSION) {
      console.log(`Migrating local data from v${currentVersion} to v${this.CURRENT_SCHEMA_VERSION}`);

      let migratedVersion = currentVersion;

      for (const migration of MIGRATIONS) {
        if (migration.version > currentVersion) {
          if (migration.migrateLocal) {
            await migration.migrateLocal(this.storageService);
          }
          migratedVersion = migration.version;
        }
      }

      this.storageService.setItem(STORAGE_KEYS.SCHEMA_VERSION, migratedVersion.toString());
      console.log(`Local migration to v${migratedVersion} complete`);
    }
  }
}
