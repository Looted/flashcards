import { Component, inject, computed, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { GameStore } from './game-store';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.component.css']
})
export class App implements OnInit {
  store = inject(GameStore);
  pwaService = inject(PwaService);

  // Computed values for header
  shouldShowCardCount = computed(() => this.store.phase() === 'PLAYING');
  currentCardIndex = computed(() => this.store.graduatePile().length);
  totalCardCount = computed(() => this.store.activeDeck().length);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    this.pwaService.init();
  }
}
