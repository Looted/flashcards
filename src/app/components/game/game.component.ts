import { Component, inject, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';
import { GameService } from '../../services/game.service';
import { CardRendererComponent } from '../card-renderer/card-renderer.component';
import { GAME_CONSTANTS } from '../../shared/constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, CardRendererComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  store = inject(GameStore);
  gameService = inject(GameService);
  router = inject(Router);

  @ViewChild(CardRendererComponent) cardRef?: CardRendererComponent;

  constructor() {
    // Redirect to menu if no active game
    effect(() => {
      if (this.store.phase() === 'MENU' && this.store.activeDeck().length === 0) {
        this.router.navigate(['/']);
      }
    });

    effect(() => {
      if (this.store.phase() === 'SUMMARY') {
        this.router.navigate(['/summary']);
      }
    });
  }

  handleAnswer(correct: boolean) {
    this.cardRef?.resetFlip();
    setTimeout(() => {
      this.gameService.handleAnswer(correct);
    }, GAME_CONSTANTS.FLIP_DELAY);
  }

  skipCard() {
    this.cardRef?.resetFlip();
    this.gameService.skipCard();
  }

  onTypingAnswer(event: {success: boolean}) {
    this.gameService.handleAnswer(event.success);
  }

  backToMenu() {
    this.store.reset();
    this.router.navigate(['/']);
  }
}
