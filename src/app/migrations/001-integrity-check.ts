import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';
import { Migration } from './migration.interface';
import { WordStats } from '../models/stats.model';
import { STORAGE_KEYS } from './constants';

export const migrationV1: Migration = {
  version: 1,

  async migrateFirestore(uid: string, firestoreService: FirestoreService): Promise<void> {
    // Example: Fetch progress and normalize categories
    const progress = await firestoreService.getUserProgress(uid);
    if (progress && progress.stats) {
      let hasChanges = false;
      const updatedStats: Record<string, WordStats> = {};

      // Iterate through stats and apply fixes if needed
      Object.entries(progress.stats).forEach(([key, stat]) => {
        // Example fix: ensure masteryLevel is within bounds
        if (stat.masteryLevel < 0) {
            stat.masteryLevel = 0;
            hasChanges = true;
        } else if (stat.masteryLevel > 5) {
            stat.masteryLevel = 5;
            hasChanges = true;
        }
        updatedStats[key] = stat;
      });

      if (hasChanges) {
        await firestoreService.saveUserProgress(uid, updatedStats);
      }
    }
  },

  migrateLocal(storageService: StorageService): void {
    const statsJson = storageService.getItem(STORAGE_KEYS.VOCABULARY_STATS);
    if (statsJson) {
      try {
        const stats: Record<string, WordStats> = JSON.parse(statsJson);
        let hasChanges = false;

        Object.values(stats).forEach(stat => {
           // Apply same logic as Firestore migration
           if (stat.masteryLevel < 0) {
             stat.masteryLevel = 0;
             hasChanges = true;
           } else if (stat.masteryLevel > 5) {
             stat.masteryLevel = 5;
             hasChanges = true;
           }
        });

        if (hasChanges) {
          storageService.setItem(STORAGE_KEYS.VOCABULARY_STATS, JSON.stringify(stats));
        }
      } catch (e) {
        console.error('Error migrating local stats:', e);
      }
    }
  }
};
