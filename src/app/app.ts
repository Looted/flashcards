import { Component, inject, computed, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { GameStore } from './game-store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.component.css']
})
export class App {
  store = inject(GameStore);

  // Computed values for header
  shouldShowCardCount = computed(() => this.store.phase() === 'PLAYING');
  currentCardIndex = computed(() => this.store.currentIndex());
  totalCardCount = computed(() => this.store.activeDeck().length);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }
}
