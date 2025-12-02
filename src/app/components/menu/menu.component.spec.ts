import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { GameMode } from '../../shared/constants';
import { vi } from 'vitest';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let gameServiceMock: any;
  let statsServiceMock: any;
  let routerMock: any;
  let storageServiceMock: any;

  beforeEach(async () => {
    gameServiceMock = {
      startGame: vi.fn().mockResolvedValue(undefined)
    };
    statsServiceMock = {
      getAllStats: vi.fn().mockReturnValue([]),
      getStatsByCategory: vi.fn().mockReturnValue([])
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
      imports: [MenuComponent],
      providers: [
        { provide: GameService, useValue: gameServiceMock },
        { provide: VocabularyStatsService, useValue: statsServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageServiceMock }
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

  it('should have categories array with HR and PM categories', () => {
    expect(component.categories).toHaveLength(2);

    const hrCategory = component.categories.find(cat => cat.id === 'hr');
    expect(hrCategory).toBeDefined();
    expect(hrCategory!.name).toBe('HR Words');
    expect(hrCategory!.icon).toBe('👥');
    expect(hrCategory!.bgClass).toBe('bg-purple-50 hover:bg-purple-100');
    expect(hrCategory!.textClass).toBe('text-purple-700');

    const pmCategory = component.categories.find(cat => cat.id === 'pm');
    expect(pmCategory).toBeDefined();
    expect(pmCategory!.name).toBe('Project Management');
    expect(pmCategory!.icon).toBe('📊');
    expect(pmCategory!.bgClass).toBe('bg-blue-50 hover:bg-blue-100');
    expect(pmCategory!.textClass).toBe('text-blue-700');
  });

  it('should initialize selectedCategory signal', () => {
    expect(component.selectedCategory()).toBeNull();
  });

  describe('ngOnInit', () => {
    it('should set useStatic to true on mobile devices', () => {
      // Mock window.innerWidth for mobile
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 500, // Mobile width
        writable: true
      });

      component.ngOnInit();

      expect(component.useStatic()).toBe(true);

      // Restore original value
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true
      });
    });

    it('should not change useStatic on desktop devices', () => {
      // Mock window.innerWidth for desktop
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 1024, // Desktop width
        writable: true
      });

      component.ngOnInit();

      expect(component.useStatic()).toBe(true); // Initial value

      // Restore original value
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true
      });
    });

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

      expect(gameServiceMock.startGame).toHaveBeenCalledWith('IT', GameMode.New, 'classic', true, null);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
      expect(component.isLoading).toBe(false);
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

      expect(component.isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[MenuComponent] Failed to start session:', error);
      expect(alertSpy).toHaveBeenCalledWith('Failed to start session. Please try again.');
      expect(component.currentScreen()).toBe('home');
      expect(component.selectedCategory()).toBe(null);

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should pass selected options to startGame', async () => {
      component.useStatic.set(false);
      component.selectedDifficulty.set(3);
      component.selectedPracticeMode.set(GameMode.Practice);
      component.selectedGameMode.set('blitz');
      component.selectedCategory.set('HR');

      await component.startSession();

      expect(gameServiceMock.startGame).toHaveBeenCalledWith('HR', GameMode.Practice, 'blitz', false, 3);
    });

    it('should set loading state during game start', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      gameServiceMock.startGame.mockReturnValue(promise);
      component.selectedCategory.set('IT');

      const startPromise = component.startSession();
      expect(component.isLoading).toBe(true);

      resolvePromise!();
      await startPromise;
      expect(component.isLoading).toBe(false);
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
          { provide: StorageService, useValue: storageServiceMock }
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
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.New, 'classic', true, null);
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
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('pm', GameMode.Practice, 'classic', true, null);
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

  describe('onAICheckboxChange', () => {
    it('should set useStatic to false when AI checkbox is checked', () => {
      const event = { target: { checked: true } } as any;
      component.onAICheckboxChange(event);
      expect(component.useStatic()).toBe(false);
    });

    it('should set useStatic to true when AI checkbox is unchecked', () => {
      const event = { target: { checked: false } } as any;
      component.onAICheckboxChange(event);
      expect(component.useStatic()).toBe(true);
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
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.New, 'classic', true, null);
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
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('pm', GameMode.Practice, 'classic', true, null);
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
      expect(gameServiceMock.startGame).toHaveBeenCalledWith('hr', GameMode.Practice, 'blitz', true, 2);
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
        expect(component.getCategoryName('hr')).toBe('HR Words');
        expect(component.getCategoryName('pm')).toBe('Project Management');
      });

      it('should return empty string for invalid category id', () => {
        expect(component.getCategoryName('invalid')).toBe('');
        expect(component.getCategoryName(null)).toBe('');
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
