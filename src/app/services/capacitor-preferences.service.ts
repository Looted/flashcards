import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class CapacitorPreferencesService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Get an item from Capacitor Preferences storage
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error(`Failed to get item from Preferences: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in Capacitor Preferences storage
   * @param key The key to store
   * @param value The value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`Failed to set item in Preferences: ${key}`, error);
    }
  }

  /**
   * Remove an item from Capacitor Preferences storage
   * @param key The key to remove
   */
  async removeItem(key: string): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Failed to remove item from Preferences: ${key}`, error);
    }
  }

  /**
   * Clear all items from Capacitor Preferences storage
   */
  async clear(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Failed to clear Preferences storage', error);
    }
  }

  /**
   * Get all keys from Capacitor Preferences storage
   * @returns Array of all stored keys
   */
  async getKeys(): Promise<string[]> {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const result = await Preferences.keys();
      return result.keys || [];
    } catch (error) {
      console.error('Failed to get keys from Preferences storage', error);
      return [];
    }
  }
}
