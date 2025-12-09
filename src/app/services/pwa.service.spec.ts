import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';

describe('PwaService', () => {
  let service: PwaService;
  let mockWindow: any;
  let mockSwUpdate: any;

  beforeEach(() => {
    // Mock window object
    mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock global window
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });

    // Mock SwUpdate
    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: of(),
      activateUpdate: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        PwaService,
        { provide: SwUpdate, useValue: mockSwUpdate }
      ]
    });
    service = TestBed.inject(PwaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize event listeners when window is defined', () => {
      service.init();

      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(2);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    });

    it('should skip initialization when window is undefined', () => {
      // Temporarily remove window
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });

      service.init();

      // Restore window for other tests
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      });

      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('beforeinstallprompt event', () => {
    it('should handle beforeinstallprompt event and show install button', () => {
      service.init();

      const beforeInstallPromptHandler = mockWindow.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'beforeinstallprompt'
      )[1];

      const mockEvent = {
        preventDefault: vi.fn()
      };

      beforeInstallPromptHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(service.showInstallButton()).toBe(true);
    });
  });

  describe('appinstalled event', () => {
    it('should handle appinstalled event and hide install button', () => {
      // First trigger beforeinstallprompt to set up the deferred prompt
      service.init();

      const beforeInstallPromptHandler = mockWindow.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'beforeinstallprompt'
      )[1];

      const mockEvent = {
        preventDefault: vi.fn()
      };

      beforeInstallPromptHandler(mockEvent);

      // Now trigger appinstalled
      const appInstalledHandler = mockWindow.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'appinstalled'
      )[1];

      appInstalledHandler();

      expect(service.showInstallButton()).toBe(false);
    });
  });

  describe('installPWA', () => {
    it('should install PWA when deferred prompt exists', async () => {
      // Set up deferred prompt
      const mockDeferredPrompt = {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      (service as any).deferredPrompt = mockDeferredPrompt;

      await service.installPWA();

      expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
      expect(service.showInstallButton()).toBe(false);
      expect((service as any).deferredPrompt).toBeNull();
    });

    it('should handle user dismissing install prompt', async () => {
      const mockDeferredPrompt = {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };

      (service as any).deferredPrompt = mockDeferredPrompt;

      await service.installPWA();

      expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
      expect(service.showInstallButton()).toBe(false);
      expect((service as any).deferredPrompt).toBeNull();
    });

    it('should do nothing when no deferred prompt exists', async () => {
      (service as any).deferredPrompt = null;

      await service.installPWA();

      // No assertions needed, just ensure no errors
      expect(service.showInstallButton()).toBe(false);
    });
  });

  describe('showInstallButton signal', () => {
    it('should initialize with false', () => {
      expect(service.showInstallButton()).toBe(false);
    });

    it('should be reactive to changes', () => {
      service.init();

      const beforeInstallPromptHandler = mockWindow.addEventListener.mock.calls.find(
        (call: [string, Function]) => call[0] === 'beforeinstallprompt'
      )![1];

      const mockEvent = {
        preventDefault: vi.fn()
      };

      beforeInstallPromptHandler(mockEvent);

      expect(service.showInstallButton()).toBe(true);
    });
  });
});
