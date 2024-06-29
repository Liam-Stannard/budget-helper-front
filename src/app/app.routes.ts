import { Routes } from '@angular/router';
import { LandingComponent } from '../pages/landing/landing.component';

export const routes: Routes = [
  {
    component: LandingComponent,
    path: 'login',
    title: 'Login',
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
