import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let languageServiceMock: any;
  let routerMock: any;
  let fixture: any;

  const setup = () => {
    languageServiceMock = {
      currentLanguage: signal('pl'),
      setLanguage: vi.fn(),
      getLanguageDisplayName: vi.fn().mockImplementation((lang: string) => {
        switch (lang) {
          case 'pl': return 'Polish';
          case 'es': return 'Spanish';
          default: return 'Polish';
        }
      })
    };

    const routerEvents = new Subject();
    routerMock = {
      url: '/menu',
      events: routerEvents.asObservable(),
      // Method to simulate navigation for tests
      navigateTo: (url: string) => {
        routerMock.url = url;
        routerEvents.next(new NavigationEnd(1, url, url));
      }
    };

    TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, component, routerMock };
  };

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should display "Native language:" label with globe icon', () => {
    const { fixture } = setup();
    const label = fixture.nativeElement.querySelector('span.text-gray-600');

    expect(label?.textContent).toContain('Native language:');
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy(); // globe icon
  });

  it('should render language buttons', () => {
    const { fixture } = setup();
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent.trim()).toBe('PL');
    expect(buttons[1].textContent.trim()).toBe('ES');
  });

  it('should apply active styles to current native language button', () => {
    const { fixture } = setup();
    languageServiceMock.currentLanguage.set('es');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const esButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'ES');

    expect(esButton?.classList.contains('text-indigo-600')).toBe(true);
    expect(esButton?.classList.contains('underline')).toBe(true);
  });

  it('should call setLanguage when button is clicked', () => {
    const { fixture } = setup();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const esButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'ES');

    esButton?.click();

    expect(languageServiceMock.setLanguage).toHaveBeenCalledWith('es');
  });

  it('should have proper accessibility attributes', () => {
    const { fixture } = setup();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const plButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'PL');

    expect(plButton?.getAttribute('aria-current')).toBe('true');
    expect(plButton?.getAttribute('aria-label')).toBe('Set native language to Polish');
  });

  describe('Game state handling', () => {
    it('should disable language switcher during active game', async () => {
      const { fixture, routerMock } = setup();
      routerMock.navigateTo('/game');
      await fixture.whenStable();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(true);
        expect(button.classList.contains('cursor-not-allowed')).toBe(true);
      });
    });

    it('should enable language switcher on menu screen', async () => {
      const { fixture, routerMock } = setup();
      routerMock.navigateTo('/menu');
      await fixture.whenStable();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(false);
      });
    });

    it('should show tooltip when game is active and switcher is hovered', async () => {
      const { fixture, routerMock } = setup();
      routerMock.navigateTo('/game');
      await fixture.whenStable();
      fixture.detectChanges();

      const tooltip = fixture.nativeElement.querySelector('.group-hover\\:visible');
      expect(tooltip).toBeTruthy();
      expect(tooltip.textContent).toContain('Finish your game to change language');
    });

    it('should not change language when button clicked during game', async () => {
      const { fixture, routerMock } = setup();
      routerMock.navigateTo('/game');
      await fixture.whenStable();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const esButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'ES');
      esButton?.click();

      expect(languageServiceMock.setLanguage).not.toHaveBeenCalled();
    });

    it('should allow language change when on summary screen', async () => {
      const { fixture, routerMock } = setup();
      routerMock.navigateTo('/summary');
      await fixture.whenStable();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      const esButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'ES');
      esButton?.click();

      expect(languageServiceMock.setLanguage).toHaveBeenCalledWith('es');
    });
  });
});
