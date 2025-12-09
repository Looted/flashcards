import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-update-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-prompt.html',
  styleUrls: ['./update-prompt.css']
})
export class UpdatePromptComponent {
  pwaService = inject(PwaService);

  update() {
    this.pwaService.updateApp();
  }

  close() {
    this.pwaService.updateAvailable.set(false);
  }
}
