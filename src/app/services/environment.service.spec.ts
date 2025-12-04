import { TestBed } from '@angular/core/testing';
import { EnvironmentService } from './environment.service';
import { isDevMode } from '@angular/core';

describe('EnvironmentService', () => {
  let service: EnvironmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnvironmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return isDevMode() for isAiModeEnabled', () => {
    // Test that isAiModeEnabled returns the result of isDevMode()
    const devModeResult = isDevMode();
    expect(service.isAiModeEnabled).toBe(devModeResult);
  });
});
