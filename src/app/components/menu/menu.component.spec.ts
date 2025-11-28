import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { GameService } from '../../services/game.service';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let gameServiceMock: any;
  let statsServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    gameServiceMock = {
      startGame: vi.fn().mockResolvedValue(undefined)
    };
    statsServiceMock = {
      getAllStats: vi.fn().mockReturnValue([])
    };
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: GameService, useValue: gameServiceMock },
        { provide: VocabularyStatsService, useValue: statsServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call startGame and navigate on selectTopic', async () => {
    await component.selectTopic('IT');

    expect(gameServiceMock.startGame).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
  });
});
