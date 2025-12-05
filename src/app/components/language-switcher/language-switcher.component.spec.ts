import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { GameStore } from '../../game-store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let languageServiceMock: any;
  let routerMock: any;
  let gameStoreMock: any;
  let fixture: any;

  const setup = (gamePhase: 'MENU' | 'PLAYING' | 'SUMMARY' = 'MENU') => {
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

    gameStoreMock = {
      phase: signal(gamePhase)
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
        { provide: GameStore, useValue: gameStoreMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, component, routerMock, gameStoreMock };
  };

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should render dropdown trigger button', () => {
    const { fixture } = setup();
    const triggerButton = fixture.nativeElement.querySelector('button[aria-label="Change language"]');

    expect(triggerButton).toBeTruthy();
    expect(triggerButton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should display current language flag and code', () => {
    const { fixture } = setup();
    const flagSpan = fixture.nativeElement.querySelector('span.text-xl');
    const codeSpan = fixture.nativeElement.querySelector('span.hidden.sm\\:block');

    expect(flagSpan?.textContent).toBe('🇵🇱'); // Default is 'pl'
    expect(codeSpan?.textContent.trim()).toBe('pl');
  });

  it('should toggle dropdown when trigger button is clicked', () => {
    const { fixture, component } = setup();
    const triggerButton = fixture.nativeElement.querySelector('button[aria-label="Change language"]');

    expect(component.isDropdownOpen()).toBe(false);

    triggerButton.click();
    expect(component.isDropdownOpen()).toBe(true);

    triggerButton.click();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should render dropdown menu with all languages when open', () => {
    const { fixture, component } = setup();

    component.isDropdownOpen.set(true);
    fixture.detectChanges();

    const dropdownMenu = fixture.nativeElement.querySelector('.absolute.right-0');
    const languageButtons = dropdownMenu.querySelectorAll('button');

    expect(dropdownMenu).toBeTruthy();
    expect(languageButtons.length).toBe(4); // es, pl, de, fr
  });

  it('should call setLanguage when language is selected', () => {
    const { fixture, component } = setup();

    component.isDropdownOpen.set(true);
    fixture.detectChanges();

    const languageButtons = fixture.nativeElement.querySelectorAll('.absolute.right-0 button') as NodeListOf<HTMLButtonElement>;
    const spanishButton = Array.from(languageButtons).find(btn =>
      btn.textContent?.includes('Spanish')
    );

    spanishButton?.click();

    expect(languageServiceMock.setLanguage).toHaveBeenCalledWith('es');
    expect(component.isDropdownOpen()).toBe(false); // Should close after selection
  });

  it('should close dropdown when clicking outside', () => {
    const { fixture, component } = setup();

    component.isDropdownOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('div.fixed.inset-0');
    backdrop.click();

    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should have proper accessibility attributes', () => {
    const { fixture } = setup();
    const triggerButton = fixture.nativeElement.querySelector('button[aria-label="Change language"]');

    expect(triggerButton?.getAttribute('aria-label')).toBe('Change language');
    expect(triggerButton?.getAttribute('aria-expanded')).toBe('false');
  });

  describe('Game Active Behavior', () => {
    it('should disable language switching when game is active', () => {
      const { fixture, component } = setup('PLAYING');
      const triggerButton = fixture.nativeElement.querySelector('button');

      expect(component.isGameActive()).toBeTruthy();
      expect(triggerButton?.getAttribute('aria-label')).toBe('Language switching disabled during game');
      expect(triggerButton?.hasAttribute('disabled')).toBeTruthy();
      expect(triggerButton?.classList.contains('cursor-not-allowed')).toBeTruthy();
      expect(triggerButton?.classList.contains('opacity-50')).toBeTruthy();
    });

    it('should enable language switching when game is not active', () => {
      const { fixture, component } = setup('MENU');
      const triggerButton = fixture.nativeElement.querySelector('button');

      expect(component.isGameActive()).toBeFalsy();
      expect(triggerButton?.getAttribute('aria-label')).toBe('Change language');
      expect(triggerButton?.hasAttribute('disabled')).toBeFalsy();
      expect(triggerButton?.classList.contains('cursor-pointer')).toBeTruthy();
    });

    it('should not toggle dropdown when game is active', () => {
      const { fixture, component } = setup('PLAYING');
      const triggerButton = fixture.nativeElement.querySelector('button');

      expect(component.isDropdownOpen()).toBe(false);

      triggerButton.click();
      expect(component.isDropdownOpen()).toBe(false); // Should remain closed
    });

    it('should not change language when game is active', () => {
      const { fixture, component } = setup('PLAYING');

      component.isDropdownOpen.set(true);
      fixture.detectChanges();

      const languageButtons = fixture.nativeElement.querySelectorAll('.absolute.right-0 button') as NodeListOf<HTMLButtonElement>;
      const spanishButton = Array.from(languageButtons).find(btn =>
        btn.textContent?.includes('Spanish')
      );

      spanishButton?.click();

      expect(languageServiceMock.setLanguage).not.toHaveBeenCalled();
    });
  });
});
