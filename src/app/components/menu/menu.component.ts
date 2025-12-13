import { Component, inject, signal, computed, OnInit, Inject, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { StorageService } from '../../services/storage.service';
import { PwaService } from '../../services/pwa.service';
import { AuthService } from '../../services/auth.service';
import { FreemiumService } from '../../services/freemium.service';
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
  pwaService = inject(PwaService);
  authService = inject(AuthService);

  // Two-screen navigation
  currentScreen = signal<'home' | 'config'>('home');

  // Game configuration
  selectedDifficulty = signal<number | null>(null);
  selectedPracticeMode = signal<GameMode>(GameMode.New);
  selectedGameMode = signal<GameModeType>('classic');
  selectedCategory = signal<string | null>(null);
  isLoading = signal(false);

  // Last session settings for "Continue Learning"
  lastSession = signal<{
    category: string;
    practiceMode: GameMode;
    gameMode: GameModeType;
    difficulty: number | null;
  } | null>(null);

  // Freemium State
  isPremium = signal<boolean>(false);
  exhaustedDifficulties = signal<Set<number>>(new Set());
  startButtonState = signal<'blue' | 'gold'>('blue');

  // Computed category stats using reactive signals
  categoryStats = computed(() => {
    const needsReviewByCategory = this.statsService.wordsNeedingReviewByCategory();
    return this.categories.map(category => {
      const categoryStats = this.statsService.getStatsByCategory(category.id);
      const mastered = categoryStats.filter(s => s.masteryLevel >= 4).length;
      const needsPractice = needsReviewByCategory[category.id] || 0;

      return {
        ...category,
        mastered,
        needsPractice,
        totalLearned: mastered + needsPractice
      };
    });
  });

  // Computed signal for total words needing review
  totalWordsNeedingReview = computed(() => this.statsService.totalWordsNeedingReview());

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
      id: 'technology',
      name: 'Technology',
      icon: '💻',
      bgClass: 'bg-indigo-50 hover:bg-indigo-100',
      borderClass: 'border-indigo-200',
      textClass: 'text-indigo-700',
      ringClass: 'ring-indigo-500'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: '💰',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-700',
      ringClass: 'ring-emerald-500'
    },
    {
      id: 'sales',
      name: 'Sales',
      icon: '📈',
      bgClass: 'bg-orange-50 hover:bg-orange-100',
      borderClass: 'border-orange-200',
      textClass: 'text-orange-700',
      ringClass: 'ring-orange-500'
    },
    {
      id: 'hr',
      name: 'HR',
      icon: '👥',
      bgClass: 'bg-purple-50 hover:bg-purple-100',
      borderClass: 'border-purple-200',
      textClass: 'text-purple-700',
      ringClass: 'ring-purple-500'
    },
    {
      id: 'strategy',
      name: 'Strategy',
      icon: '🎯',
      bgClass: 'bg-slate-50 hover:bg-slate-100',
      borderClass: 'border-slate-200',
      textClass: 'text-slate-700',
      ringClass: 'ring-slate-500'
    }
  ];

  GameMode = GameMode;

  get isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  }

  freemiumService = inject(FreemiumService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Effect to check exhaustion whenever category or difficulty changes
    effect(async () => {
      const category = this.selectedCategory();
      const difficulty = this.selectedDifficulty();
      const practiceMode = this.selectedPracticeMode();

      // Check premium status
      const premium = await this.authService.isPremiumUser();
      this.isPremium.set(premium);

      // Check category exhaustion using freemium service
      const isCategoryExhausted = category ? await this.freemiumService.isCategoryExhausted(category) : false;

      if (category && !premium) {
        // Check exhaustion for all difficulty levels (New Words)
        const levels = [1, 2, 3];
        const counts = await Promise.all(levels.map(l => this.gameService.getRemainingNewWordsCount(category, l)));

        const exhausted = new Set<number>();
        counts.forEach((count, index) => {
          if (count === 0) exhausted.add(levels[index]);
        });
        this.exhaustedDifficulties.set(exhausted);

        // Check start button state
        let availableWords = 0;

        if (practiceMode === GameMode.New) {
          // Check remaining new words
          availableWords = await this.gameService.getRemainingNewWordsCount(category, difficulty ?? undefined);

          // Gold button if no new words available (redirects to paywall)
          this.startButtonState.set((availableWords === 0) ? 'gold' : 'blue');
        } else {
          // Practice mode: check words needing practice
          // Practice mode never redirects to paywall (never gold), unless we want to enforce some limit
          // User requirement: "Practice mode should remain available (not gold/paywalled) as long as there are words needing practice"
          this.startButtonState.set('blue');
        }
      } else {
        this.exhaustedDifficulties.set(new Set());
        this.startButtonState.set('blue');
      }
    });
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Load last session from storage
      const storedSession = await this.storageService.getItem('lastSession');
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

    // Redirect to Paywall if content is exhausted (Gold button)
    if (this.startButtonState() === 'gold') {
      this.router.navigate(['/paywall']);
      return;
    }

    this.isLoading.set(true);
    try {
      await this.gameService.startGame(
        category,
        this.selectedPracticeMode(),
        this.selectedGameMode(),
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
      // Handle freemium limit exhausted error
      if (error instanceof Error && error.message === 'FREEMIUM_LIMIT_EXHAUSTED') {
        this.router.navigate(['/paywall']);
      } else {
        alert('Failed to start session. Please try again.');
        this.currentScreen.set('home');
        this.selectedCategory.set(null);
      }
    } finally {
      this.isLoading.set(false);
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

  getPracticeWordsCount(): number {
    // Get all words that need practice (non-mastered words that have been encountered)
    const category = this.selectedCategory();
    if (!category) return 0;
    const practiceWords = this.statsService.getWordsNeedingPractice(1000, category);
    return practiceWords.length;
  }

  // Freemium logic methods
  async getAvailableWordsCount(categoryId: string | null, difficulty?: number): Promise<number> {
    if (!categoryId) return 0;
    return this.gameService.getAvailableWordsCount(categoryId, difficulty);
  }

  async isPremiumUser(): Promise<boolean> {
    return this.authService.isPremiumUser();
  }

  // Check if a specific difficulty tier is exhausted for free users
  async isDifficultyExhausted(categoryId: string, difficulty: number): Promise<boolean> {
    const availableWords = await this.getAvailableWordsCount(categoryId, difficulty);
    const isPremium = await this.isPremiumUser();
    return !isPremium && availableWords === 0;
  }

  // Get button state for start session button
  async getStartButtonState(categoryId: string | null, difficulty: number | null): Promise<'blue' | 'gold'> {
    if (!categoryId) return 'blue';

    const availableWords = await this.getAvailableWordsCount(categoryId, difficulty ?? undefined);
    const isPremium = await this.isPremiumUser();

    // Gold button means paywall/upsell (no available words for free user)
    if (!isPremium && availableWords === 0) {
      return 'gold';
    }

    // Blue button means ready to play
    return 'blue';
  }

  // Check if a category is exhausted for free users (using freemium service)
  async isCategoryExhausted(categoryId: string): Promise<boolean> {
    return this.freemiumService.isCategoryExhausted(categoryId);
  }
}
