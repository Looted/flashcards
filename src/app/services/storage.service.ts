import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CapacitorPreferencesService } from './capacitor-preferences.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private capacitorPreferences: CapacitorPreferencesService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async getItem(key: string): Promise<string | null> {
    return this.capacitorPreferences.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.capacitorPreferences.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.capacitorPreferences.removeItem(key);
  }

  async clear(): Promise<void> {
    return this.capacitorPreferences.clear();
  }
}
