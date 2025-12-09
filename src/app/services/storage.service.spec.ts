import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('StorageService', () => {
  let service: StorageService;
  let mockLocalStorage: any;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(StorageService);
  });

  describe('Browser platform', () => {
    it('should get item from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-value');
      const result = service.getItem('test-key');
      expect(result).toBe('test-value');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null when localStorage.getItem returns null', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = service.getItem('test-key');
      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should set item in localStorage', () => {
      service.setItem('test-key', 'test-value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should remove item from localStorage', () => {
      service.removeItem('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should clear localStorage', () => {
      service.clear();
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });
  });
});
