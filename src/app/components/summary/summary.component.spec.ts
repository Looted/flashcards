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

  beforeEach(async () => {
    gameStoreMock = {
      activeDeck: signal([]),
      graduatePile: signal([]),
      reset: vi.fn()
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
