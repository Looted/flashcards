import { Injectable, inject } from '@angular/core';
import { GameMode } from '../core/models/game-config.model';
import { LanguageService } from './language.service';
import { createStandardGameMode, createBlitzGameMode } from '../core/config/game-modes';

export type GameModeType = 'classic' | 'blitz';

@Injectable({
  providedIn: 'root'
})
export class GameModeService {
  private languageService = inject(LanguageService);

  getGameMode(type: GameModeType): GameMode {
    switch (type) {
      case 'classic':
        return createStandardGameMode(this.languageService);
      case 'blitz':
        return createBlitzGameMode(this.languageService);
      default:
        return createStandardGameMode(this.languageService);
    }
  }

  // Keep backward compatibility
  getStandardGameMode(): GameMode {
    return this.getGameMode('classic');
  }
}
