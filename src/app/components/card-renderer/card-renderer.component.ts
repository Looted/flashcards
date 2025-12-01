import { Component, input, computed, ViewChild, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashcardComponent } from '../../flashcard.component';
import { TypingCardComponent } from '../typing-card/typing-card.component';
import { Flashcard } from '../../game-store';
import { LayoutPolicy } from '../../core/models/game-config.model';

@Component({
  selector: 'app-card-renderer',
  standalone: true,
  imports: [CommonModule, FlashcardComponent, TypingCardComponent],
  template: `
    <!-- Wrapper to ensure width context -->
    <div class="w-full h-full flex justify-center">
      @if ((layoutConfig().templateId || 'flashcard_standard') === 'flashcard_standard') {
        <app-flashcard
          class="w-full"
          [frontText]="frontText()"
          [backText]="backText()"
          [frontLabel]="frontLabel()"
          [backLabel]="backLabel()"
          #flashcardRef>
        </app-flashcard>
      } @else if (layoutConfig().templateId === 'typing_challenge') {
        <app-typing-card
          class="w-full"
          [promptText]="frontText()"
          [expectedAnswer]="backText()"
          (answerSubmitted)="onAnswerSubmitted($event)">
        </app-typing-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CardRendererComponent {
  card = input.required<Flashcard>();
  layoutConfig = input.required<LayoutPolicy>();

  answerSubmitted = output<{success: boolean}>();

  @ViewChild('flashcardRef') flashcard?: FlashcardComponent;

  frontText = computed(() => {
    const config = this.layoutConfig();
    if (!config) return '';
    const card = this.card();
    const dataMap = config.dataMap;
    return card[dataMap.primary as keyof Flashcard] as string;
  });

  backText = computed(() => {
    const config = this.layoutConfig();
    if (!config) return '';
    const card = this.card();
    const dataMap = config.dataMap;
    return card[dataMap.secondary as keyof Flashcard] as string;
  });

  frontLabel = computed(() => {
    const config = this.layoutConfig();
    if (!config) return 'Front';
    const dataMap = config.dataMap;
    return dataMap.primary === 'english' ? 'English' : 'Polish';
  });

  backLabel = computed(() => {
    const config = this.layoutConfig();
    if (!config) return 'Back';
    const dataMap = config.dataMap;
    return dataMap.secondary === 'english' ? 'English' : 'Polish';
  });

  onAnswerSubmitted(event: {success: boolean}) {
    this.answerSubmitted.emit(event);
  }

  resetFlip() {
    this.flashcard?.resetFlip();
  }
}
