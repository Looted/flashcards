import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  pwaService = inject(PwaService);

  @Input() showCardCount = false;
  @Input() currentIndex = 0;
  @Input() totalCards = 0;

  onInstallClick() {
    this.pwaService.installPWA();
  }
}
