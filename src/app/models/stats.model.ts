import { Timestamp } from '@angular/fire/firestore';

export interface WordStats {
  english: string;
  category: string;
  timesEncountered: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastEncountered: number; // timestamp in ms
  masteryLevel: number; // 0-5 scale
  skipped?: boolean;
}

export interface UserProgress {
  stats: Record<string, WordStats>;
  updatedAt: Timestamp;
}
