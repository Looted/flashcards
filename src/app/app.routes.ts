import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app').then(m => m.App)
  },
  {
    path: 'learn',
    loadComponent: () => import('./learning.component').then(m => m.LearningComponent)
  }
];
