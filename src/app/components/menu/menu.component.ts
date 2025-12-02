import { Component, inject, signal, computed, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { StorageService } from '../../services/storage.service';
import { GameMode } from '../../shared/constants';
import { GameModeType } from '../../services/game-mode.service';

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
  storageService = inject(StorageService);

  // Two-screen navigation
  currentScreen = signal<'home' | 'config'>('home');

  // Game configuration
  useStatic = signal(true);
  selectedDifficulty = signal<number | null>(null);
  selectedPracticeMode = signal<GameMode>(GameMode.New);
  selectedGameMode = signal<GameModeType>('classic');
  selectedCategory = signal<string | null>(null);
  isLoading = false;

  // Computed signal for AI checkbox - true when AI is enabled
  useAI = computed(() => !this.useStatic());

  // Last session settings for "Continue Learning"
  lastSession = signal<{
    category: string;
    practiceMode: GameMode;
    gameMode: GameModeType;
    difficulty: number | null;
  } | null>(null);

  // Computed category stats
  categoryStats = computed(() => {
    return this.categories.map(category => {
      const categoryStats = this.statsService.getStatsByCategory(category.id);
      const mastered = categoryStats.filter(s => s.masteryLevel >= 4).length;
      const needsPractice = categoryStats.filter(s => s.masteryLevel < 2).length;

      return {
        ...category,
        mastered,
        needsPractice,
        totalLearned: mastered + needsPractice
      };
    });
  });

  // Overall stats for the stats bar
  overallStats = computed(() => {
    const allStats = this.statsService.getAllStats();
    const mastered = allStats.filter(s => s.masteryLevel >= 4).length;
    const needsPractice = allStats.filter(s => s.masteryLevel < 2).length;

    return {
      mastered,
      needsPractice,
      grade: this.calculateGrade(mastered, needsPractice)
    };
  });

  categories = [
    {
      id: 'hr',
      name: 'HR Words',
      icon: '👥',
      bgClass: 'bg-purple-50 hover:bg-purple-100',
      borderClass: 'border-purple-200',
      textClass: 'text-purple-700',
      ringClass: 'ring-purple-500'
    },
    {
      id: 'pm',
      name: 'Project Management',
      icon: '📊',
      bgClass: 'bg-blue-50 hover:bg-blue-100',
      borderClass: 'border-blue-200',
      textClass: 'text-blue-700',
      ringClass: 'ring-blue-500'
    }
  ];

  GameMode = GameMode;

  get isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isMobile) {
        this.useStatic.set(true);
      }

      // Load last session from storage
      const storedSession = this.storageService.getItem('lastSession');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          this.lastSession.set(sessionData);
        } catch (error) {
          console.warn('Failed to parse stored session data:', error);
        }
      }
    }
  }

  onAICheckboxChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.useStatic.set(!checked); // checked=true means AI on, so useStatic=false
  }

  // Two-screen navigation
  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.currentScreen.set('config');
  }

  backToHome() {
    this.currentScreen.set('home');
    this.selectedCategory.set(null);
  }

  // Quick actions
  async quickStartNew(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.selectedPracticeMode.set(GameMode.New);
    this.selectedGameMode.set('classic'); // Default
    this.selectedDifficulty.set(null); // All levels
    await this.startSession();
  }

  async quickStartPracticeFromHome(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.selectedPracticeMode.set(GameMode.Practice);
    this.selectedGameMode.set('classic'); // Default
    this.selectedDifficulty.set(null); // All levels
    await this.startSession();
  }

  quickStartNewWords() {
    if (!this.selectedCategory()) return;
    this.selectedPracticeMode.set(GameMode.New);
    this.startSession();
  }

  quickStartPractice() {
    if (!this.selectedCategory()) return;
    this.selectedPracticeMode.set(GameMode.Practice);
    this.startSession();
  }

  continueLearning() {
    const session = this.lastSession();
    if (!session) return;

    this.selectedCategory.set(session.category);
    this.selectedPracticeMode.set(session.practiceMode);
    this.selectedGameMode.set(session.gameMode);
    this.selectedDifficulty.set(session.difficulty);
    this.startSession();
  }

  async startSession() {
    const category = this.selectedCategory();
    if (!category) return;

    this.isLoading = true;
    try {
      await this.gameService.startGame(
        category,
        this.selectedPracticeMode(),
        this.selectedGameMode(),
        this.useStatic(),
        this.selectedDifficulty()
      );

      // Save last session settings
      const sessionData = {
        category,
        practiceMode: this.selectedPracticeMode(),
        gameMode: this.selectedGameMode(),
        difficulty: this.selectedDifficulty()
      };
      this.lastSession.set(sessionData);

      // Persist to storage
      this.storageService.setItem('lastSession', JSON.stringify(sessionData));

      this.router.navigate(['/game']);
    } catch (error) {
      console.error('[MenuComponent] Failed to start session:', error);
      alert('Failed to start session. Please try again.');
      this.currentScreen.set('home');
      this.selectedCategory.set(null);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateGrade(mastered: number, needsPractice: number): string {
    const total = mastered + needsPractice;
    if (total === 0) return 'N/A';

    const ratio = mastered / total;
    if (ratio >= 0.9) return 'A';
    if (ratio >= 0.8) return 'B';
    if (ratio >= 0.7) return 'C';
    if (ratio >= 0.6) return 'D';
    return 'F';
  }

  // Template helper methods
  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '';
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || '';
  }

  getDifficultyDisplayName(difficulty: number | null): string {
    if (difficulty === null) return 'All levels';
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'All levels';
    }
  }

  getCategoryStats(categoryId: string) {
    return this.categoryStats().find(c => c.id === categoryId) || { mastered: 0, needsPractice: 0, totalLearned: 0 };
  }

  getProgressPercentage(category: any): number {
    // For now, return 0 since we don't have total words to calculate percentage
    // In the future, this could be calculated as (mastered + needsPractice) / totalWords * 100
    return 0;
  }

  getNewWordsCount(categoryId: string | null): number {
    // Return 0 to avoid displaying misleading counts for future AI integration
    return 0;
  }

  getMistakesCount(categoryId: string | null): number {
    // Return 0 to avoid displaying misleading counts for future AI integration
    return 0;
  }
}
