import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';
import { GameService } from '../../services/game.service';
import { FlashcardComponent } from '../../flashcard.component';
import { GAME_CONSTANTS } from '../../shared/constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FlashcardComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  store = inject(GameStore);
  gameService = inject(GameService);
  router = inject(Router);

  inputControl = new FormControl('');
  typingFeedback: { correct: boolean, msg: string } | null = null;
  isPaused = signal(false);

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

    effect(() => {
      if (this.isPaused()) {
        this.inputControl.disable();
      } else {
        this.inputControl.enable();
      }
    });
  }

  handleAnswer(correct: boolean, cardComp: FlashcardComponent) {
    cardComp.resetFlip();
    setTimeout(() => {
      this.gameService.handleAnswer(correct);
    }, GAME_CONSTANTS.FLIP_DELAY);
  }

  skipCard(cardComp: FlashcardComponent) {
    cardComp.resetFlip();
    this.gameService.skipCard();
  }

  backToMenu() {
    this.store.reset();
    this.router.navigate(['/']);
  }

  checkTyping() {
    if (!this.inputControl.value) return;

    const input = this.inputControl.value.trim().toLowerCase();
    const correct = this.store.currentCard()?.english.toLowerCase();

    if (input === correct) {
      this.typingFeedback = { correct: true, msg: 'Correct!' };
      setTimeout(() => {
        this.gameService.handleAnswer(true);
        this.inputControl.setValue('');
        this.typingFeedback = null;
      }, GAME_CONSTANTS.FEEDBACK_DELAY);
    } else {
      this.typingFeedback = { correct: false, msg: `Incorrect. It was: ${correct}` };
      this.isPaused.set(true);
      // Do not auto-proceed; wait for continue button
    }
  }

  continueAfterWrongAnswer() {
    this.isPaused.set(false);
    this.typingFeedback = null;
    this.inputControl.setValue('');
    this.gameService.handleAnswer(false);
  }
}
