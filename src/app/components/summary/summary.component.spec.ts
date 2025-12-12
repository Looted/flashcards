import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { GameStore } from '../../game-store';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';
import { FreemiumService } from '../../services/freemium.service';
import { StaticVocabularyService } from '../../services/static-vocabulary.service';
import { GameModeService } from '../../services/game-mode.service';
import { LanguageService } from '../../services/language.service';
import { of } from 'rxjs';

describe('SummaryComponent', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;
  let gameStoreMock: any;
  let routerMock: any;
  let storageServiceMock: any;
  let statsServiceMock: any;
  let initialSessionDeckSignal: any;
  let graduatePileSignal: any;
  let skippedPileSignal: any;

  beforeEach(async () => {
    initialSessionDeckSignal = signal([]);
    graduatePileSignal = signal([]);
    skippedPileSignal = signal([]);

    gameStoreMock = {
      initialSessionDeck: initialSessionDeckSignal,
      graduatePile: graduatePileSignal,
      skippedPile: skippedPileSignal,
      reset: vi.fn(),
      startNewGame: vi.fn(),
      sessionConfig: signal({
        category: 'test',
        practiceMode: 'new' as any,
        gameMode: 'classic' as any,
        difficulty: null
      })
    };
    routerMock = {
      navigate: vi.fn()
    };
    storageServiceMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    statsServiceMock = {
      getAllStats: vi.fn().mockReturnValue([]),
      wordsNeedingReviewByCategory: {},
      totalWordsNeedingReview: 0
    };

    const gameServiceMock = {
      startGame: vi.fn().mockResolvedValue(undefined)
    };

    const authServiceMock = {
      isPremiumUser: vi.fn().mockResolvedValue(false)
    };

    const freemiumServiceMock = {
      isCategoryExhausted: vi.fn().mockReturnValue(false),
      resetAllSessionTracking: vi.fn()
    };

    const staticVocabServiceMock = {
      generateTranslatedWords: vi.fn().mockReturnValue(of([])),
      getAvailableWordsCount: vi.fn().mockReturnValue(of(10))
    };

    const gameModeServiceMock = {
      getGameMode: vi.fn().mockReturnValue({
        id: 'test',
        rounds: []
      })
    };

    const languageServiceMock = {
      currentLanguage: vi.fn().mockReturnValue('pl')
    };

    await TestBed.configureTestingModule({
      imports: [SummaryComponent],
      providers: [
        { provide: GameStore, useValue: gameStoreMock },
        { provide: VocabularyStatsService, useValue: statsServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: GameService, useValue: gameServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FreemiumService, useValue: freemiumServiceMock },
        { provide: StaticVocabularyService, useValue: staticVocabServiceMock },
        { provide: GameModeService, useValue: gameModeServiceMock },
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .overrideComponent(SummaryComponent, {
      set: {
        providers: []
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start new game and navigate to game on startNewSession', async () => {
    component.startNewSession();

    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    const gameServiceMock = TestBed.inject(GameService);
    expect(gameServiceMock.startGame).toHaveBeenCalledWith('test', 'new', 'classic', null);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
  });

  it('should reset store and navigate to home on backToHome', () => {
    component.backToHome();

    expect(gameStoreMock.reset).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('Template data binding', () => {
    it('should display mastered and needs learning counts', async () => {
      const mockCards = [
        { id: '1', english: 'Hello', translations: { polish: 'Cześć' }, category: 'Basic', masteryLevel: 0 },
        { id: '2', english: 'Goodbye', translations: { polish: 'Do widzenia' }, category: 'Basic', masteryLevel: 0 },
        { id: '3', english: 'Thank you', translations: { polish: 'Dziękuję' }, category: 'Basic', masteryLevel: 0 }
      ];

      // Set up stats where "Hello" is mastered (masteryLevel >= 4)
      const mockStats = [
        { english: 'Hello', polish: 'Cześć', category: 'Basic', timesEncountered: 10, timesCorrect: 10, timesIncorrect: 0, lastEncountered: Date.now(), masteryLevel: 5, skipped: false },
        { english: 'Goodbye', polish: 'Do widzenia', category: 'Basic', timesEncountered: 1, timesCorrect: 0, timesIncorrect: 1, lastEncountered: Date.now(), masteryLevel: 0, skipped: false },
        { english: 'Thank you', polish: 'Dziękuję', category: 'Basic', timesEncountered: 1, timesCorrect: 0, timesIncorrect: 1, lastEncountered: Date.now(), masteryLevel: 0, skipped: false }
      ];

      initialSessionDeckSignal.set(mockCards);
      graduatePileSignal.set([mockCards[0]]); // Hello was learned (graduated)
      skippedPileSignal.set([mockCards[1]]);   // Goodbye was skipped
      statsServiceMock.getAllStats.mockReturnValue(mockStats);
      fixture.detectChanges();
      await fixture.whenStable();

      const spans = fixture.nativeElement.querySelectorAll('.flex.justify-between > span:last-child');
      const wordsLearnedSpan = spans[0]; // Words Learned (in New Words mode)
      const needsSpan = spans[1];   // Needs Practice

      expect(wordsLearnedSpan.textContent.trim()).toBe('1'); // Hello was learned (graduated)
      expect(needsSpan.textContent.trim()).toBe('1');   // Goodbye was skipped
    });

    it('should display zero counts when all signals are empty', async () => {
      initialSessionDeckSignal.set([]);
      graduatePileSignal.set([]);
      skippedPileSignal.set([]);
      fixture.detectChanges();
      await fixture.whenStable();

      const spans = fixture.nativeElement.querySelectorAll('.flex.justify-between > span:last-child');
      const masteredSpan = spans[0]; // New Words Learned
      const needsSpan = spans[1];   // Needs Practice

      expect(masteredSpan.textContent.trim()).toBe('0');
      expect(needsSpan.textContent.trim()).toBe('0');
    });
  });

  describe('UI elements', () => {
    it('should render session complete message', () => {
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading.textContent.trim()).toBe('Session Complete!');
    });

    it('should render celebration icon', () => {
      const starIcon = fixture.nativeElement.querySelector('.bg-gradient-to-br svg');
      expect(starIcon).toBeTruthy();
    });

    it('should render start new session button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons[0].textContent.trim()).toBe('Start New Session');
    });

    it('should render back to home button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons[1].textContent.trim()).toBe('Back to Home');
    });

    it('should call startNewSession when start new session button is clicked', async () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons[0].click();

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      const gameServiceMock = TestBed.inject(GameService);
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('test', 'new', 'classic', null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
    });

    it('should call backToHome when back to home button is clicked', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons[1].click();

      expect(gameStoreMock.reset).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
