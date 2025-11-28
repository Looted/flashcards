import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { PwaService } from '../../services/pwa.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let pwaServiceMock: any;

  beforeEach(async () => {
    pwaServiceMock = {
      showInstallButton: signal(false),
      installPWA: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: PwaService, useValue: pwaServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Flashcards');
  });

  it('should call installPWA when button is clicked', () => {
    pwaServiceMock.showInstallButton.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(pwaServiceMock.installPWA).toHaveBeenCalled();
  });
});
