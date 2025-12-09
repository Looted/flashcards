import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swUpdate = inject(SwUpdate);
  private deferredPrompt: any = null;

  readonly showInstallButton = signal(false);
  readonly updateAvailable = signal(false);

  init() {
    if (typeof window === 'undefined') return; // Skip on server-side

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Update UI to notify the user they can install the PWA
      this.showInstallButton.set(true);
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      // Hide the install button when the PWA has been installed
      this.showInstallButton.set(false);
      this.deferredPrompt = null;
    });

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.updateAvailable.set(true);
        });
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) return;

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    // Hide the install button regardless of the outcome
    this.showInstallButton.set(false);

    // Clear the deferredPrompt
    this.deferredPrompt = null;
  }

  updateApp() {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
