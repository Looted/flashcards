import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { CapacitorPreferencesService } from './capacitor-preferences.service';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('StorageService', () => {
  let service: StorageService;
  let mockCapacitorPreferences: any;

  beforeEach(() => {
    mockCapacitorPreferences = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CapacitorPreferencesService, useValue: mockCapacitorPreferences }
      ]
    });

    service = TestBed.inject(StorageService);
  });

  describe('Browser platform', () => {
    it('should get item from CapacitorPreferences', async () => {
      mockCapacitorPreferences.getItem.mockResolvedValue('test-value');
      const result = await service.getItem('test-key');
      expect(result).toBe('test-value');
      expect(mockCapacitorPreferences.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null when CapacitorPreferences.getItem returns null', async () => {
      mockCapacitorPreferences.getItem.mockResolvedValue(null);
      const result = await service.getItem('test-key');
      expect(result).toBeNull();
      expect(mockCapacitorPreferences.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should set item in CapacitorPreferences', async () => {
      mockCapacitorPreferences.setItem.mockResolvedValue(undefined);
      await service.setItem('test-key', 'test-value');
      expect(mockCapacitorPreferences.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should remove item from CapacitorPreferences', async () => {
      mockCapacitorPreferences.removeItem.mockResolvedValue(undefined);
      await service.removeItem('test-key');
      expect(mockCapacitorPreferences.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should clear CapacitorPreferences', async () => {
      mockCapacitorPreferences.clear.mockResolvedValue(undefined);
      await service.clear();
      expect(mockCapacitorPreferences.clear).toHaveBeenCalled();
    });
  });
});
