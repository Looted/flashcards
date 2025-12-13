import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { StorageService } from './storage.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockMatchMedia: any;
  let mockStorageService: any;

  beforeEach(() => {
    // Mock matchMedia
    mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });

    // Mock StorageService
    mockStorageService = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: mockStorageService }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default system mode', () => {
    expect(service.themeMode()).toBe('system');
  });

  it('should set theme mode', async () => {
    await service.setThemeMode('dark');
    expect(service.themeMode()).toBe('dark');
  });

  it('should cycle themes correctly', async () => {
    await service.setThemeMode('light');
    expect(service.themeMode()).toBe('light');

    await service.cycleTheme();
    expect(service.themeMode()).toBe('dark');

    await service.cycleTheme();
    expect(service.themeMode()).toBe('system');

    await service.cycleTheme();
    expect(service.themeMode()).toBe('light');
  });
});
