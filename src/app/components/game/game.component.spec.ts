import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { GameStore } from '../../game-store';
import { GameService } from '../../services/game.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { signal, WritableSignal } from '@angular/core';
import { vi, Mock } from 'vitest';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  // Define mock types
  type MockGameStore = {
    phase: WritableSignal<string>;
    progress: WritableSignal<number>;
    currentCard: WritableSignal<any>;
    activeDeck: WritableSignal<any[]>;
    currentRoundConfig: Mock;
    reset: Mock;
  };

  type MockGameService = {
    handleAnswer: Mock;
    skipCard: Mock;
  };

  type MockRouter = {
    navigate: Mock;
  };

  let gameStoreMock: MockGameStore;
  let gameServiceMock: MockGameService;
  let routerMock: MockRouter;
  let storageServiceMock: any;

  beforeEach(async () => {
    gameStoreMock = {
      phase: signal('PLAYING'),
      progress: signal(0),
      currentCard: signal({ english: 'cat', polish: 'kot' }),
      activeDeck: signal([{ id: '1', english: 'test', polish: 'test' }]),
      currentRoundConfig: vi.fn().mockReturnValue({ layout: { templateId: 'flashcard_standard', dataMap: { primary: 'term', secondary: 'definition' } } }),
      reset: vi.fn()
    };
    gameServiceMock = {
      handleAnswer: vi.fn(),
      skipCard: vi.fn()
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

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: GameStore, useValue: gameStoreMock },
        { provide: GameService, useValue: gameServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor effects', () => {
    it('should navigate to menu when phase is MENU and no active deck', () => {
      gameStoreMock.phase.set('MENU');
      gameStoreMock.activeDeck.set([]);
      fixture.detectChanges();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to summary when phase is SUMMARY', () => {
      gameStoreMock.phase.set('SUMMARY');
      fixture.detectChanges();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/summary']);
    });
  });

  describe('handleAnswer', () => {
    it('should handle answer after delay', async () => {
      vi.useFakeTimers();
      component.handleAnswer(true);

      vi.advanceTimersByTime(100); // GAME_CONSTANTS.FLIP_DELAY
      expect(gameServiceMock.handleAnswer).toHaveBeenCalledWith(true);

      vi.useRealTimers();
    });
  });

  describe('skipCard', () => {
    it('should delegate to game service', () => {
      component.skipCard();
      expect(gameServiceMock.skipCard).toHaveBeenCalled();
    });
  });

  describe('onTypingAnswer', () => {
    it('should delegate to game service', () => {
      component.onTypingAnswer({ success: true });
      expect(gameServiceMock.handleAnswer).toHaveBeenCalledWith(true);
    });
  });

  describe('backToMenu', () => {
    it('should reset store and navigate to menu', () => {
      component.backToMenu();
      expect(gameStoreMock.reset).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
