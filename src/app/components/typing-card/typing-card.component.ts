import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GAME_CONSTANTS } from '../../shared/constants';

@Component({
  selector: 'app-typing-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg border-b-4 border-indigo-200 p-6 flex flex-col items-center text-center">
        <div class="text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-2">Translate to English</div>
        <h2 class="text-3xl font-bold text-slate-800 mb-8">{{ promptText() }}</h2>

        <input type="text" [formControl]="inputControl" (keyup.enter)="checkTyping()"
          placeholder="Type English word..."
          class="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white outline-none text-lg text-center font-semibold text-slate-700 transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed">

        <button (click)="checkTyping()" [disabled]="isPaused()"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          Check Answer
        </button>

        @if (typingFeedback()) {
          <div class="mt-4 p-3 rounded-lg w-full font-medium"
               [ngClass]="typingFeedback()!.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
            {{ typingFeedback()!.msg }}
          </div>

          @if (isPaused()) {
            <button (click)="continueAfterWrongAnswer()"
              class="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md active:translate-y-0.5 transition-all">
              Continue
            </button>
          }
        }
     </div>
  `,
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
