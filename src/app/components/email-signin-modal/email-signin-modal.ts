import { Component, input, output, inject, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

type AuthMode = 'signin' | 'signup';

@Component({
  selector: 'app-email-signin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-signin-modal.html',
  styleUrl: './email-signin-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailSigninModal {
  private authService = inject(AuthService);

  // Input signals
  isOpen = input.required<boolean>();

  // Output events
  close = output<void>();
  signedIn = output<void>();

  // Form state
  mode = signal<AuthMode>('signin');
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Host listener for escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.isOpen()) {
      (event as KeyboardEvent).preventDefault();
      this.onClose();
    }
  }

  onBackdropClick() {
    this.onClose();
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  toggleMode() {
    this.mode.update(m => m === 'signin' ? 'signup' : 'signin');
    this.error.set(null);
  }

  async onSubmit() {
    if (this.isLoading()) return;

    const email = this.email().trim();
    const password = this.password();

    if (!email || !password) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (this.mode() === 'signin') {
        await this.authService.signInWithEmail(email, password);
      } else {
        await this.authService.signUpWithEmail(email, password);
      }
      this.signedIn.emit();
      this.onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      // Handle Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        this.error.set('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        this.error.set('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        this.error.set('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        this.error.set('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        this.error.set('Invalid email address');
      } else {
        this.error.set('An error occurred. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetForm() {
    this.email.set('');
    this.password.set('');
    this.error.set(null);
    this.mode.set('signin');
    this.isLoading.set(false);
  }
}
