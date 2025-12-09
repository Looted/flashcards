import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';

export interface Migration {
  version: number;
  migrateFirestore?: (uid: string, firestore: FirestoreService) => Promise<void>;
  migrateLocal?: (storage: StorageService) => void | Promise<void>;
}
