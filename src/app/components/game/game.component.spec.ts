import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { GameStore } from '../../game-store';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let gameStoreMock: any;
  let gameServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    gameStoreMock = {
      phase: signal('PLAYING'),
      currentRound: signal('RECOGNIZE_EN'),
      progress: signal(0),
      currentCard: signal({ english: 'cat', polish: 'kot' }),
      reset: vi.fn()
    };
    gameServiceMock = {
      handleAnswer: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: GameStore, useValue: gameStoreMock },
        { provide: GameService, useValue: gameServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to summary when phase is SUMMARY', () => {
    gameStoreMock.phase.set('SUMMARY');
    fixture.detectChanges();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/summary']);
  });
});
