import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-round-intro',
  standalone: true,
  template: '<div class="mock-round-intro">Mock Round Intro</div>'
})
export class MockRoundIntroComponent {
  intro = input.required<any>();
  continue = output<void>();
  skipAll = output<void>();
}
