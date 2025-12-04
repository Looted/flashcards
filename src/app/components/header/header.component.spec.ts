import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { PwaService } from '../../services/pwa.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ThemeService } from '../../services/theme.service';
import { EnvironmentService } from '../../services/environment.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let pwaServiceMock: any;
  let routerMock: any;
  let storageServiceMock: any;
  let themeServiceMock: any;
  let environmentServiceMock: any;

  beforeAll(() => {
    vi.useFakeTimers();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    pwaServiceMock = {
      showInstallButton: signal(false),
      installPWA: vi.fn().mockResolvedValue(undefined)
    };

    routerMock = {
      navigate: vi.fn(),
      events: {
        pipe: vi.fn().mockReturnValue({
          subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn()
          })
        })
      }
    };

    storageServiceMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    themeServiceMock = {
      themeMode: signal('system'),
      cycleTheme: vi.fn()
    };

    environmentServiceMock = {
      isAiModeEnabled: true
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).overrideComponent(HeaderComponent, {
      set: {
        providers: [
        { provide: PwaService, useValue: pwaServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: EnvironmentService, useValue: environmentServiceMock }
        ]
      }
    }
    )
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('BizzWords');
  });

  it('should call installPWA when button is clicked', () => {
    pwaServiceMock.showInstallButton.set(true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const installButton = Array.from(buttons as NodeListOf<HTMLElement>).find(btn => btn.textContent?.trim().includes('Install'));
    expect(installButton).toBeTruthy();
    installButton!.click();

    expect(pwaServiceMock.installPWA).toHaveBeenCalled();
  });

  it('should navigate to home when logo is clicked', () => {
    const logo = fixture.nativeElement.querySelector('[data-test-="header-logo"]');
    logo.click();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('Triple-click easter egg', () => {
    let logo: HTMLElement;

    beforeEach(() => {
      logo = fixture.nativeElement.querySelector('[data-test-="header-logo"]');
      // Reset state
      component.showDevControls.set(false);
      component['logoClickCount'] = 0;
      vi.clearAllTimers();
    });

    it('should navigate to home on single click', () => {
      logo.click();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
      expect(component.showDevControls()).toBe(false);
    });

    it('should navigate to home on double click', () => {
      logo.click();
      logo.click();

      expect(routerMock.navigate).toHaveBeenCalledTimes(2);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
      expect(component.showDevControls()).toBe(false);
    });

    it('should toggle dev controls on triple click', () => {
      // Initial state: dev controls hidden
      expect(component.showDevControls()).toBe(false);

      // Triple click
      logo.click();
      logo.click();
      logo.click();

      expect(component.showDevControls()).toBe(true);
      expect(routerMock.navigate).toHaveBeenCalledTimes(2); // Only on first two clicks
    });

    it('should hide dev controls on second triple click', () => {
      // First triple click to show
      logo.click();
      logo.click();
      logo.click();
      expect(component.showDevControls()).toBe(true);

      // Second triple click to hide
      logo.click();
      logo.click();
      logo.click();
      expect(component.showDevControls()).toBe(false);
    });

    it('should reset click count after timeout', () => {
      // Click twice quickly
      logo.click();
      logo.click();

      // Advance timer past timeout
      vi.advanceTimersByTime(500);

      // Third click should not trigger dev controls (count was reset)
      logo.click();

      expect(component.showDevControls()).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledTimes(3);
    });

    it('should reset click count after successful triple click', () => {
      // Triple click to show dev controls
      logo.click();
      logo.click();
      logo.click();
      expect(component.showDevControls()).toBe(true);

      // Next click should navigate to home, not trigger dev controls again
      logo.click();
      expect(routerMock.navigate).toHaveBeenCalledTimes(3); // 2 from first two clicks + 1 from fourth click
    });
  });

  describe('ngOnDestroy', () => {
    let clearTimeoutSpy: any;

    beforeEach(() => {
      clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    });

    afterEach(() => {
      if (clearTimeoutSpy && clearTimeoutSpy.mockRestore) {
        clearTimeoutSpy.mockRestore();
      }
    });

    it('should clear timeout on destroy', () => {
      // Trigger a click to set timeout
      const logo = fixture.nativeElement.querySelector('[data-test-="header-logo"]');
      logo.click();

      // Destroy component
      component.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should not clear timeout if none is set', () => {
      // Destroy component without setting timeout
      component.ngOnDestroy();

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });
  });
});
