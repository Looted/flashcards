import { Component, input } from '@angular/core';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  template: '<div class="mock-flashcard">Mock Flashcard</div>'
})
export class MockFlashcardComponent {
  frontText = input<string>();
  backText = input<string>();
  frontLabel = input<string>();
  backLabel = input<string>();

  resetFlip() {
    // Mock implementation
  }
}
