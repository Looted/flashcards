import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-typing-card',
  standalone: true,
  template: '<div class="mock-typing-card">Mock Typing Card</div>'
})
export class MockTypingCardComponent {
  promptText = input.required<string>();
  expectedAnswer = input.required<string>();
  label = input<string>();
  placeholder = input<string>();

  answerSubmitted = output<{ success: boolean }>();
}
