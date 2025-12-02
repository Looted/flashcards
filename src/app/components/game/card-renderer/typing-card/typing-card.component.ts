import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GAME_CONSTANTS } from '../../../../shared/constants';

@Component({
  selector: 'app-typing-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './typing-card.component.html',
  styles: []
})
export class TypingCardComponent {
  promptText = input.required<string>();
  expectedAnswer = input.required<string>();

  answerSubmitted = output<{success: boolean}>();

  inputControl = new FormControl('');
  typingFeedback = signal<{ correct: boolean, msg: string } | null>(null);
  isPaused = signal(false);

  constructor() {
    effect(() => {
      if (this.isPaused()) {
        this.inputControl.disable();
      } else {
        this.inputControl.enable();
      }
    });
  }

  checkTyping() {
    if (!this.inputControl.value) return;

    const input = this.inputControl.value.trim().toLowerCase();
    const correct = this.expectedAnswer().toLowerCase();

    if (input === correct) {
      this.typingFeedback.set({ correct: true, msg: 'Correct!' });
      setTimeout(() => {
        this.answerSubmitted.emit({success: true});
        this.inputControl.setValue('');
        this.typingFeedback.set(null);
      }, GAME_CONSTANTS.FEEDBACK_DELAY);
    } else {
      this.typingFeedback.set({ correct: false, msg: `Incorrect. It was: ${correct}` });
      this.isPaused.set(true);
    }
  }

  continueAfterWrongAnswer() {
    this.isPaused.set(false);
    this.typingFeedback.set(null);
    this.inputControl.setValue('');
    this.answerSubmitted.emit({success: false});
  }
}
