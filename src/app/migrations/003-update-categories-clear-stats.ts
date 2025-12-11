import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';
import { Migration } from './migration.interface';
import { STORAGE_KEYS } from './constants';

export const migrationV3: Migration = {
  version: 3,

  async migrateFirestore(uid: string, firestoreService: FirestoreService): Promise<void> {
    console.log('Clearing Firestore vocabulary stats for V3 migration (Category Updates)');
    await firestoreService.saveUserProgress(uid, {});
  },

  migrateLocal(storageService: StorageService): void {
    console.log('Clearing local vocabulary stats for V3 migration (Category Updates)');
    storageService.removeItem(STORAGE_KEYS.VOCABULARY_STATS);
  }
};
