import { Injectable, inject } from '@angular/core';
import { GameMode } from '../core/models/game-config.model';
import { LanguageService } from './language.service';
import { createStandardGameMode } from '../core/config/game-modes';

@Injectable({
  providedIn: 'root'
})
export class GameModeService {
  private languageService = inject(LanguageService);

  getStandardGameMode(): GameMode {
    return createStandardGameMode(this.languageService);
  }
}
