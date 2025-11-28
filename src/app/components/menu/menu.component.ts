import { Component, inject, signal, computed, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { GameMode } from '../../shared/constants';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  gameService = inject(GameService);
  statsService = inject(VocabularyStatsService);
  router = inject(Router);

  useStatic = signal(true);
  selectedDifficulty = signal<number | null>(null);
  selectedMode = signal<GameMode>(GameMode.New);
  isLoading = false;

  GameMode = GameMode;

  isMobile = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isMobile()) {
        this.useStatic.set(true);
      }
    }
  }

  async selectTopic(topic: string) {
    this.isLoading = true;
    try {
      await this.gameService.startGame(
        topic,
        this.selectedMode(),
        this.useStatic(),
        this.selectedDifficulty()
      );
      this.router.navigate(['/game']);
    } finally {
      this.isLoading = false;
    }
  }
}
