import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { GameStore } from '../../game-store';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('SummaryComponent', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;
  let gameStoreMock: any;
  let routerMock: any;
  let storageServiceMock: any;
  let activeDeckSignal: any;
  let graduatePileSignal: any;

  beforeEach(async () => {
    activeDeckSignal = signal([]);
    graduatePileSignal = signal([]);

    gameStoreMock = {
      activeDeck: activeDeckSignal,
      graduatePile: graduatePileSignal,
      reset: vi.fn(),
      startNewGame: vi.fn()
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
      imports: [SummaryComponent],
      providers: [
        { provide: GameStore, useValue: gameStoreMock },
        { provide: Router, useValue: routerMock },
        { provide: StorageService, useValue: storageServiceMock },
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

  it('should expose Math object for template use', () => {
    expect(component.Math).toBe(Math);
  });

  it('should start new game and navigate to game on startNewSession', () => {
    component.startNewSession();

    expect(gameStoreMock.startNewGame).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
  });

  it('should reset store and navigate to home on backToHome', () => {
    component.backToHome();

    expect(gameStoreMock.reset).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('Template data binding', () => {
    it('should display total cards count', async () => {
      activeDeckSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
      fixture.detectChanges();
      await fixture.whenStable();

      const totalCardsElement = fixture.nativeElement.querySelector('.border-b .text-2xl');
      expect(totalCardsElement.textContent.trim()).toBe('3');
    });

    it('should display needs practice count', async () => {
      activeDeckSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
      graduatePileSignal.set([{ id: 1 }]); // 1 graduated, 2 need practice
      fixture.detectChanges();
      await fixture.whenStable();

      const needsPracticeElement = fixture.nativeElement.querySelector('.text-amber-500, .text-green-500');
      expect(needsPracticeElement.textContent.trim()).toBe('2');
    });

    it('should display zero needs practice when all cards graduated', async () => {
      activeDeckSignal.set([{ id: 1 }, { id: 2 }]);
      graduatePileSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }]); // More graduated than active
      fixture.detectChanges();
      await fixture.whenStable();

      const needsPracticeElement = fixture.nativeElement.querySelector('.text-amber-500, .text-green-500');
      expect(needsPracticeElement.textContent.trim()).toBe('0');
    });

    it('should display zero total cards when deck is empty', async () => {
      activeDeckSignal.set([]);
      graduatePileSignal.set([]);
      fixture.detectChanges();
      await fixture.whenStable();

      const totalCardsElement = fixture.nativeElement.querySelector('.border-b .text-2xl');
      const needsPracticeElement = fixture.nativeElement.querySelector('.text-amber-500, .text-green-500');
      expect(totalCardsElement.textContent.trim()).toBe('0');
      expect(needsPracticeElement.textContent.trim()).toBe('0');
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

    it('should call startNewSession when start new session button is clicked', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons[0].click();

      expect(gameStoreMock.startNewGame).toHaveBeenCalled();
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
