import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent {
  store = inject(GameStore);
  router = inject(Router);

  // Expose Math for template use
  Math = Math;

  startNewSession() {
    this.store.reset();
    this.router.navigate(['/']);
  }
}
