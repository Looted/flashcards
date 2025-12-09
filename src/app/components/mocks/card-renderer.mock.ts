import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-card-renderer',
  standalone: true,
  template: '<div class="mock-card-renderer">Mock Card Renderer</div>'
})
export class MockCardRendererComponent {
  card = input.required<any>();
  layoutConfig = input.required<any>();

  answerSubmitted = output<{ success: boolean }>();
}
