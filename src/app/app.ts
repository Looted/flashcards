import { Component, inject, computed, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { UpdatePromptComponent } from './components/update-prompt/update-prompt.component';
import { GameStore } from './game-store';
import { PwaService } from './services/pwa.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, UpdatePromptComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.component.css']
})
export class App implements OnInit {
  store = inject(GameStore);
  pwaService = inject(PwaService);
  themeService = inject(ThemeService); // Inject to initialize

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    this.pwaService.init();
  }
}
