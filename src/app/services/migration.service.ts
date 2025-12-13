import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private readonly storageService = inject(StorageService);
  private readonly firestoreService = inject(FirestoreService);

  private readonly VOCABULARY_STATS_KEY = 'vocabulary-stats';
  private readonly LANGUAGE_KEY = 'nativeLanguage';
  private readonly THEME_KEY = 'theme-mode';

  /**
   * Migrates guest user data from localStorage to Firestore.
   * This should only be called once per user after first login.
   */
  async migrateGuestDataToUser(uid: string): Promise<void> {
    try {
      console.log('Starting migration for user:', uid);

      // Check if migration already completed
      const userProfile = await this.firestoreService.getUserProfile(uid);
      if (userProfile?.hasMigratedLocalData) {
        console.log('Migration already completed for user:', uid);
        return;
      }

      // Step 1: Migrate vocabulary stats
      await this.migrateVocabularyStats(uid);

      // Step 2: Migrate user settings
      await this.migrateUserSettings(uid);

      // Step 3: Mark migration as complete
      await this.firestoreService.markMigrationComplete(uid);

      console.log('Migration completed successfully for user:', uid);

    } catch (error) {
      console.error('Migration failed for user:', uid, error);
      throw error;
    }
  }

  private async migrateVocabularyStats(uid: string): Promise<void> {
    const vocabularyData = await this.storageService.getItem(this.VOCABULARY_STATS_KEY);
    if (!vocabularyData) {
      console.log('No vocabulary stats to migrate');
      return;
    }

    try {
      const stats = JSON.parse(vocabularyData);
      await this.firestoreService.saveUserProgress(uid, stats);
      console.log('Vocabulary stats migrated successfully');
    } catch (error) {
      console.error('Failed to migrate vocabulary stats:', error);
      throw error;
    }
  }

  private async migrateUserSettings(uid: string): Promise<void> {
    const language = await this.storageService.getItem(this.LANGUAGE_KEY);
    const theme = await this.storageService.getItem(this.THEME_KEY);

    const settings: any = {};

    if (language && ['pl', 'es'].includes(language)) {
      settings.nativeLanguage = language;
    }

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      settings.themeMode = theme;
    }

    if (Object.keys(settings).length > 0) {
      await this.firestoreService.updateUserSettings(uid, settings);
      console.log('User settings migrated successfully:', settings);
    } else {
      console.log('No valid settings to migrate');
    }
  }

  /**
   * Checks if a user has local data that needs migration.
   * Useful for showing migration prompts or warnings.
   */
  async hasLocalDataToMigrate(): Promise<boolean> {
    const hasVocabularyStats = !!await this.storageService.getItem(this.VOCABULARY_STATS_KEY);
    const hasLanguage = !!await this.storageService.getItem(this.LANGUAGE_KEY);
    const hasTheme = !!await this.storageService.getItem(this.THEME_KEY);

    return hasVocabularyStats || hasLanguage || hasTheme;
  }

  /**
   * Clears localStorage data after successful migration.
   * Call this after migration is confirmed to be complete.
   */
  async clearMigratedLocalData(): Promise<void> {
    await this.storageService.removeItem(this.VOCABULARY_STATS_KEY);
    await this.storageService.removeItem(this.LANGUAGE_KEY);
    await this.storageService.removeItem(this.THEME_KEY);
    console.log('Migrated localStorage data cleared');
  }

  /**
   * Gets a summary of what data will be migrated.
   * Useful for showing to users before migration.
   */
  async getMigrationSummary(): Promise<{ vocabularyWords: number; hasLanguage: boolean; hasTheme: boolean }> {
    let vocabularyWords = 0;
    let hasLanguage = false;
    let hasTheme = false;

    const vocabData = await this.storageService.getItem(this.VOCABULARY_STATS_KEY);
    if (vocabData) {
      try {
        const stats = JSON.parse(vocabData);
        vocabularyWords = Object.keys(stats).length;
      } catch (error) {
        console.warn('Could not parse vocabulary stats for summary:', error);
      }
    }

    hasLanguage = !!await this.storageService.getItem(this.LANGUAGE_KEY);
    hasTheme = !!await this.storageService.getItem(this.THEME_KEY);

    return { vocabularyWords, hasLanguage, hasTheme };
  }
}
