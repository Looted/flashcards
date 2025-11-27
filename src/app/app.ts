import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fiszki');

  // Selection state
  selectedTheme = signal<string | null>(null);
  selectedMode = signal<'new' | 'practice' | null>(null);

  constructor(private router: Router) {}

  // Methods
  selectTheme(theme: string) {
    this.selectedTheme.set(theme);
  }

  selectMode(mode: 'new' | 'practice') {
    this.selectedMode.set(mode);
  }

  startLearning() {
    const theme = this.selectedTheme();
    const mode = this.selectedMode();

    if (theme && mode) {
      console.log(`Starting learning session with theme: ${theme}, mode: ${mode}`);
      // Navigate to learning component
      this.router.navigate(['/learn'], {
        queryParams: { theme, mode }
      });
    }
  }
}
