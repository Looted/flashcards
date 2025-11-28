import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { GameStore } from '../../game-store';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('SummaryComponent', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;
  let gameStoreMock: any;
  let routerMock: any;

  beforeEach(async () => {
    gameStoreMock = {
      activeDeck: signal([]),
      wrongAnswers: signal([]),
      reset: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SummaryComponent],
      providers: [
        { provide: GameStore, useValue: gameStoreMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset store and navigate on startNewSession', () => {
    component.startNewSession();

    expect(gameStoreMock.reset).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });
});
