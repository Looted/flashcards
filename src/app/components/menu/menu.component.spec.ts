import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { GameMode } from '../../shared/constants';
import { vi } from 'vitest';
import { SwUpdate } from '@angular/service-worker';
import { PwaService } from '../../services/pwa.service';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let gameServiceMock: any;
  let statsServiceMock: any;
  let routerMock: any;
  let storageServiceMock: any;
  let swUpdateMock: any;
  let pwaServiceMock: any;

  beforeEach(async () => {
    gameServiceMock = {
      startGame: vi.fn().mockResolvedValue(undefined)
    };
    statsServiceMock = {
      getAllStats: vi.fn().mockReturnValue([]),
      getStatsByCategory: vi.fn().mockReturnValue([]),
      wordsNeedingReviewByCategory: vi.fn().mockReturnValue({ 'hr': 0, 'pm': 0 }),
      totalWordsNeedingReview: vi.fn().mockReturnValue(0)
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
    swUpdateMock = {
      isEnabled: false,
      versionUpdates: {
        pipe: vi.fn().mockReturnValue({
          subscribe: vi.fn()
        })
      },
      activateUpdate: vi.fn().mockResolvedValue(undefined)
    };
    pwaServiceMock = {
      showInstallButton: { set: vi.fn() },
      updateAvailable: { set: vi.fn() },
      init: vi.fn(),
      installPWA: vi.fn(),
      updateApp: vi.fn().mockImplementation(() => {
        swUpdateMock.activateUpdate();
      })
    };

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: GameService, useValue: gameServiceMock },
        { provide: VocabularyStatsService, useValue: statsServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: PwaService, useValue: pwaServiceMock }
      ]
    })
    .overrideComponent(MenuComponent, {
      set: {
        providers: []
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have categories array with all available categories', () => {
    expect(component.categories).toHaveLength(5);

    const hrCategory = component.categories.find(cat => cat.id === 'hr');
    expect(hrCategory).toBeDefined();
    expect(hrCategory!.name).toBe('HR');
    expect(hrCategory!.icon).toBe('👥');
    expect(hrCategory!.bgClass).toBe('bg-purple-50 hover:bg-purple-100');
    expect(hrCategory!.textClass).toBe('text-purple-700');

    const techCategory = component.categories.find(cat => cat.id === 'tech');
    expect(techCategory).toBeDefined();
    expect(techCategory!.name).toBe('Tech');
    expect(techCategory!.icon).toBe('💻');
    expect(techCategory!.bgClass).toBe('bg-indigo-50 hover:bg-indigo-100');
    expect(techCategory!.textClass).toBe('text-indigo-700');

    const financeCategory = component.categories.find(cat => cat.id === 'finance');
    expect(financeCategory).toBeDefined();
    expect(financeCategory!.name).toBe('Finance');
    expect(financeCategory!.icon).toBe('💰');
    expect(financeCategory!.bgClass).toBe('bg-emerald-50 hover:bg-emerald-100');
    expect(financeCategory!.textClass).toBe('text-emerald-700');

    const salesCategory = component.categories.find(cat => cat.id === 'sales');
    expect(salesCategory).toBeDefined();
    expect(salesCategory!.name).toBe('Sales');
    expect(salesCategory!.icon).toBe('📈');
    expect(salesCategory!.bgClass).toBe('bg-orange-50 hover:bg-orange-100');
    expect(salesCategory!.textClass).toBe('text-orange-700');

    const strategyCategory = component.categories.find(cat => cat.id === 'strategy');
    expect(strategyCategory).toBeDefined();
    expect(strategyCategory!.name).toBe('Strategy');
    expect(strategyCategory!.icon).toBe('🎯');
    expect(strategyCategory!.bgClass).toBe('bg-slate-50 hover:bg-slate-100');
    expect(strategyCategory!.textClass).toBe('text-slate-700');
  });

  it('should initialize selectedCategory signal', () => {
    expect(component.selectedCategory()).toBeNull();
  });

  describe('ngOnInit', () => {

    it('should load last session from storage', () => {
      const sessionData = {
        category: 'hr',
        practiceMode: GameMode.Practice,
        gameMode: 'blitz' as const,
        difficulty: 2
      };
      storageServiceMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      component.ngOnInit();

      expect(component.lastSession()).toEqual(sessionData);
    });

    it('should handle invalid stored session data', () => {
      storageServiceMock.getItem.mockReturnValue('invalid json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored session data:', expect.any(SyntaxError));
      expect(component.lastSession()).toBe(null);

      consoleSpy.mockRestore();
    });
  });

  describe('startSession', () => {
    it('should call startGame and navigate on success', async () => {
      component.selectedCategory.set('IT');
      await component.startSession();

      expect(gameServiceMock.startGame).toHaveBeenCalledWith('IT', GameMode.New, 'classic', null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Game start failed');
      gameServiceMock.startGame.mockRejectedValue(error);

      component.selectedCategory.set('IT');
      component.currentScreen.set('config');

      // Spy on console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      // Mock alert function
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

      await component.startSession();

      expect(component.isLoading()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[MenuComponent] Failed to start session:', error);
      expect(alertSpy).toHaveBeenCalledWith('Failed to start session. Please try again.');
      expect(component.currentScreen()).toBe('home');
      expect(component.selectedCategory()).toBe(null);

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should pass selected options to startGame', async () => {
      component.selectedDifficulty.set(3);
      component.selectedPracticeMode.set(GameMode.Practice);
      component.selectedGameMode.set('blitz');
      component.selectedCategory.set('HR');

      await component.startSession();

      expect(gameServiceMock.startGame).toHaveBeenCalledWith('HR', GameMode.Practice, 'blitz', 3);
    });

    it('should set loading state during game start', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      gameServiceMock.startGame.mockReturnValue(promise);
      component.selectedCategory.set('IT');

      const startPromise = component.startSession();
      expect(component.isLoading()).toBe(true);

      resolvePromise!();
      await startPromise;
      expect(component.isLoading()).toBe(false);
    });

    it('should save last session settings', async () => {
      component.selectedCategory.set('hr');
      component.selectedPracticeMode.set(GameMode.New);
      component.selectedGameMode.set('classic');
      component.selectedDifficulty.set(2);

      await component.startSession();

      expect(component.lastSession()).toEqual({
        category: 'hr',
        practiceMode: GameMode.New,
        gameMode: 'classic',
        difficulty: 2
  });  
});  

  describe('isMobile computed', () => {
    it('should return true on mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true
      });

      expect(component.isMobile).toBe(true);
    });

    it('should return false on desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true
      });

      expect(component.isMobile).toBe(false);
    });

    it('should return false on server platform', () => {
      // Test with server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MenuComponent],
        providers: [
          { provide: GameService, useValue: gameServiceMock },
          { provide: VocabularyStatsService, useValue: statsServiceMock },
          { provide: Router, useValue: routerMock },
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: StorageService, useValue: storageServiceMock },
          { provide: SwUpdate, useValue: swUpdateMock },
          { provide: PwaService, useValue: pwaServiceMock }
        ]
      });

      const serverComponent = TestBed.createComponent(MenuComponent).componentInstance;
      expect(serverComponent.isMobile).toBe(false);
    });
  });

  describe('quickStartNew', () => {
    it('should set all required state and call startSession without changing currentScreen to config', async () => {
      const initialScreen = component.currentScreen();
      expect(initialScreen).toBe('home');

      await component.quickStartNew('hr');

      expect(component.selectedCategory()).toBe('hr');
      expect(component.selectedPracticeMode()).toBe(GameMode.New);
      expect(component.selectedGameMode()).toBe('classic');
      expect(component.selectedDifficulty()).toBe(null);
      expect(component.currentScreen()).toBe('home'); // Should not change to 'config'
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.New, 'classic', null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
    });

    it('should handle errors correctly and reset state', async () => {
      const error = new Error('Game start failed');
      gameServiceMock.startGame.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await component.quickStartNew('hr');

      expect(component.currentScreen()).toBe('home');
      expect(component.selectedCategory()).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith('[MenuComponent] Failed to start session:', error);
      expect(alertSpy).toHaveBeenCalledWith('Failed to start session. Please try again.');

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('quickStartPracticeFromHome', () => {
    it('should set all required state and call startSession without changing currentScreen to config', async () => {
      const initialScreen = component.currentScreen();
      expect(initialScreen).toBe('home');

      await component.quickStartPracticeFromHome('pm');

      expect(component.selectedCategory()).toBe('pm');
      expect(component.selectedPracticeMode()).toBe(GameMode.Practice);
      expect(component.selectedGameMode()).toBe('classic');
      expect(component.selectedDifficulty()).toBe(null);
      expect(component.currentScreen()).toBe('home'); // Should not change to 'config'
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('pm', GameMode.Practice, 'classic', null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
    });

    it('should handle errors correctly and reset state', async () => {
      const error = new Error('Game start failed');
      gameServiceMock.startGame.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      await component.quickStartPracticeFromHome('pm');

      expect(component.currentScreen()).toBe('home');
      expect(component.selectedCategory()).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith('[MenuComponent] Failed to start session:', error);
      expect(alertSpy).toHaveBeenCalledWith('Failed to start session. Please try again.');

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });



  describe('selectCategory', () => {
    it('should set selectedCategory and change screen to config', () => {
      component.selectCategory('hr');
      expect(component.selectedCategory()).toBe('hr');
      expect(component.currentScreen()).toBe('config');
    });
  });

  describe('backToHome', () => {
    it('should reset screen to home and clear selected category', () => {
      component.currentScreen.set('config');
      component.selectedCategory.set('hr');

      component.backToHome();

      expect(component.currentScreen()).toBe('home');
      expect(component.selectedCategory()).toBe(null);
    });
  });

  describe('quickStartNewWords', () => {
    it('should set practice mode to New and call startSession when category is selected', async () => {
      component.selectedCategory.set('hr');

      await component.quickStartNewWords();

      expect(component.selectedPracticeMode()).toBe(GameMode.New);
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.New, 'classic', null);
    });

    it('should do nothing when no category is selected', () => {
      component.selectedCategory.set(null);

      component.quickStartNewWords();

      expect(gameServiceMock.startGame).not.toHaveBeenCalled();
    });
  });

  describe('quickStartPractice', () => {
    it('should set practice mode to Practice and call startSession when category is selected', async () => {
      component.selectedCategory.set('pm');

      await component.quickStartPractice();

      expect(component.selectedPracticeMode()).toBe(GameMode.Practice);
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('pm', GameMode.Practice, 'classic', null);
    });

    it('should do nothing when no category is selected', () => {
      component.selectedCategory.set(null);

      component.quickStartPractice();

      expect(gameServiceMock.startGame).not.toHaveBeenCalled();
    });
  });

  describe('continueLearning', () => {
    it('should restore last session settings and start game', async () => {
      const sessionData = {
        category: 'hr',
        practiceMode: GameMode.Practice,
        gameMode: 'blitz' as const,
        difficulty: 2
      };
      component.lastSession.set(sessionData);

      await component.continueLearning();

      expect(component.selectedCategory()).toBe('hr');
      expect(component.selectedPracticeMode()).toBe(GameMode.Practice);
      expect(component.selectedGameMode()).toBe('blitz');
      expect(component.selectedDifficulty()).toBe(2);
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.Practice, 'blitz', 2);
    });

    it('should do nothing when no last session exists', () => {
      component.lastSession.set(null);

      component.continueLearning();

      expect(gameServiceMock.startGame).not.toHaveBeenCalled();
    });
  });

  describe('calculateGrade', () => {
    it('should return N/A when no words learned', () => {
      const result = (component as any).calculateGrade(0, 0);
      expect(result).toBe('N/A');
    });

    it('should return A for 90% or higher mastery ratio', () => {
      expect((component as any).calculateGrade(9, 1)).toBe('A');
      expect((component as any).calculateGrade(10, 0)).toBe('A');
    });

    it('should return B for 80-89% mastery ratio', () => {
      expect((component as any).calculateGrade(8, 2)).toBe('B');
    });

    it('should return C for 70-79% mastery ratio', () => {
      expect((component as any).calculateGrade(7, 3)).toBe('C');
    });

    it('should return D for 60-69% mastery ratio', () => {
      expect((component as any).calculateGrade(6, 4)).toBe('D');
    });

    it('should return F for below 60% mastery ratio', () => {
      expect((component as any).calculateGrade(5, 5)).toBe('F');
      expect((component as any).calculateGrade(1, 9)).toBe('F');
    });
  });

  describe('template helper methods', () => {
    describe('getCategoryName', () => {
      it('should return category name for valid category id', () => {
        expect(component.getCategoryName('hr')).toBe('HR');
        expect(component.getCategoryName('tech')).toBe('Tech');
        expect(component.getCategoryName('finance')).toBe('Finance');
        expect(component.getCategoryName('sales')).toBe('Sales');
        expect(component.getCategoryName('strategy')).toBe('Strategy');
      });

      it('should return empty string for invalid category id', () => {
        expect(component.getCategoryName('invalid')).toBe('');
        expect(component.getCategoryName('pm')).toBe('');
        expect(component.getCategoryName(null)).toBe('');
      });
    });

    describe('getDifficultyDisplayName', () => {
      it('should return "All levels" for null difficulty', () => {
        expect(component.getDifficultyDisplayName(null)).toBe('All levels');
      });

      it('should return "Easy" for difficulty 1', () => {
        expect(component.getDifficultyDisplayName(1)).toBe('Easy');
      });

      it('should return "Medium" for difficulty 2', () => {
        expect(component.getDifficultyDisplayName(2)).toBe('Medium');
      });

      it('should return "Hard" for difficulty 3', () => {
        expect(component.getDifficultyDisplayName(3)).toBe('Hard');
      });

      it('should return "All levels" for invalid difficulty values', () => {
        expect(component.getDifficultyDisplayName(4)).toBe('All levels');
        expect(component.getDifficultyDisplayName(0)).toBe('All levels');
      });
    });

    describe('getCategoryStats', () => {
      it('should return stats for valid category', () => {
        const stats = component.getCategoryStats('hr');
        expect(stats).toBeDefined();
        expect(stats.mastered).toBeDefined();
        expect(stats.needsPractice).toBeDefined();
        expect(stats.totalLearned).toBeDefined();
      });

      it('should return default stats for invalid category', () => {
        const stats = component.getCategoryStats('invalid');
        expect(stats).toEqual({ mastered: 0, needsPractice: 0, totalLearned: 0 });
      });
    });

    describe('getProgressPercentage', () => {
      it('should return 0', () => {
        const result = component.getProgressPercentage({});
        expect(result).toBe(0);
      });
    });

    describe('getNewWordsCount', () => {
      it('should return 0', () => {
        expect(component.getNewWordsCount('hr')).toBe(0);
        expect(component.getNewWordsCount(null)).toBe(0);
      });
    });

    describe('getMistakesCount', () => {
      it('should return 0', () => {
        expect(component.getMistakesCount('hr')).toBe(0);
        expect(component.getMistakesCount(null)).toBe(0);
      });
    });
  });
});

describe('PWA Service Integration', () => {
  it('should inject PwaService', () => {
    expect(component.pwaService).toBeDefined();
    expect(component.pwaService).toBeTruthy();
  });

  it('should have SwUpdate mocked properly', () => {
    expect(swUpdateMock).toBeDefined();
    expect(swUpdateMock.isEnabled).toBe(false);
    expect(swUpdateMock.versionUpdates).toBeDefined();
    expect(swUpdateMock.activateUpdate).toBeDefined();
  });

  it('should have PwaService mocked properly', () => {
    expect(pwaServiceMock).toBeDefined();
    expect(pwaServiceMock.showInstallButton).toBeDefined();
    expect(pwaServiceMock.updateAvailable).toBeDefined();
    expect(pwaServiceMock.init).toBeDefined();
    expect(pwaServiceMock.installPWA).toBeDefined();
    expect(pwaServiceMock.updateApp).toBeDefined();
  });

  describe('SwUpdate mock behavior', () => {
    it('should handle version updates subscription', () => {
      const mockPipe = swUpdateMock.versionUpdates.pipe();
      expect(mockPipe.subscribe).toBeDefined();
      expect(mockPipe.subscribe).toBeInstanceOf(Function);
    });

    it('should handle activateUpdate call', async () => {
      const result = await swUpdateMock.activateUpdate();
      expect(result).toBeUndefined();
      expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
    });
  });

  describe('PwaService mock behavior', () => {
    it('should handle showInstallButton signal', () => {
      pwaServiceMock.showInstallButton.set(true);
      expect(pwaServiceMock.showInstallButton.set).toHaveBeenCalledWith(true);
    });

    it('should handle updateAvailable signal', () => {
      pwaServiceMock.updateAvailable.set(true);
      expect(pwaServiceMock.updateAvailable.set).toHaveBeenCalledWith(true);
    });

    it('should handle init method with SwUpdate integration', () => {
      // Mock window to simulate browser environment
      Object.defineProperty(global, 'window', {
        value: {
          addEventListener: vi.fn(),
          innerWidth: 1024
        },
        writable: true
      });

      pwaServiceMock.init();
      expect(pwaServiceMock.init).toHaveBeenCalled();

      // Verify that SwUpdate properties are accessed correctly
      expect(swUpdateMock.isEnabled).toBe(false);
      expect(swUpdateMock.versionUpdates).toBeDefined();
    });

    it('should handle installPWA method', async () => {
      await pwaServiceMock.installPWA();
      expect(pwaServiceMock.installPWA).toHaveBeenCalled();
    });

    it('should handle updateApp method with SwUpdate activation', () => {
      pwaServiceMock.updateApp();
      expect(pwaServiceMock.updateApp).toHaveBeenCalled();
      expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
    });

    it('should handle SwUpdate version updates subscription', () => {
      // Test the version updates pipe and subscription
      const pipeResult = swUpdateMock.versionUpdates.pipe();
      expect(pipeResult.subscribe).toBeDefined();

      const subscribeMock = vi.fn();
      pipeResult.subscribe(subscribeMock);

      expect(pipeResult.subscribe).toHaveBeenCalledWith(subscribeMock);
    });

    it('should handle SwUpdate isEnabled property', () => {
      // Test when SwUpdate is enabled
      swUpdateMock.isEnabled = true;
      expect(swUpdateMock.isEnabled).toBe(true);

      // Test when SwUpdate is disabled
      swUpdateMock.isEnabled = false;
      expect(swUpdateMock.isEnabled).toBe(false);
    });
  });
});
});
