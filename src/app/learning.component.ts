import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { AiWordGenerationService } from './services/ai-word-generation';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

interface WordPair {
  english: string;
  polish: string;
}

@Component({
  selector: 'app-learning',
  imports: [CommonModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningComponent implements OnInit {
  protected readonly words = signal<WordPair[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly showTranslation = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isGenerating = signal(false);
  protected readonly selectedTheme = signal<string>('IT');
  protected readonly selectedMode = signal<'new' | 'practice'>('new');

  constructor(
    private aiService: AiWordGenerationService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.selectedTheme.set(params['theme'] || 'IT');
      this.selectedMode.set(params['mode'] || 'new');
    });

    await this.generateWords();
  }

  private async generateWords() {
    this.isGenerating.set(true);
    try {
      const theme = this.selectedTheme();
      const generatedWords = await this.aiService.generateWords(theme, 20);
      this.words.set(generatedWords);
    } catch (error) {
      console.error('Failed to generate words:', error);
      // Fallback words for demo
      this.words.set([
        { english: 'computer', polish: 'komputer' },
        { english: 'software', polish: 'oprogramowanie' },
        { english: 'internet', polish: 'internet' },
        { english: 'database', polish: 'baza danych' },
        { english: 'algorithm', polish: 'algorytm' },
        { english: 'network', polish: 'sieć' },
        { english: 'server', polish: 'serwer' },
        { english: 'browser', polish: 'przeglądarka' },
        { english: 'keyboard', polish: 'klawiatura' },
        { english: 'mouse', polish: 'mysz' },
      ]);
    } finally {
      this.isGenerating.set(false);
    }
  }

  get currentWord(): WordPair | undefined {
    return this.words()[this.currentIndex()];
  }

  get isLastWord(): boolean {
    return this.currentIndex() >= this.words().length - 1;
  }

  get progress(): number {
    if (this.words().length === 0) return 0;
    return ((this.currentIndex() + 1) / this.words().length) * 100;
  }

  revealTranslation() {
    this.showTranslation.set(true);
  }

  markCorrect() {
    this.showTranslation.set(false);
    if (!this.isLastWord) {
      this.currentIndex.update(i => i + 1);
    } else {
      // TODO: Handle completion
      alert('Learning session complete!');
    }
  }

  markIncorrect() {
    this.showTranslation.set(false);
    if (!this.isLastWord) {
      this.currentIndex.update(i => i + 1);
    } else {
      // TODO: Handle completion
      alert('Learning session complete!');
    }
  }
}
