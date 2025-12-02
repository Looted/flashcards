import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  get isAiModeEnabled(): boolean {
    // Use Angular's isDevMode() to determine if we're in development
    // In production builds, this will be false
    return isDevMode();
  }
}
