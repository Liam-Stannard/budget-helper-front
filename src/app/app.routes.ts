import { Routes } from '@angular/router';
import { LandingComponent } from '../pages/landing/landing.component';
import { HomeComponent } from '../components/home/home.component';
import { authGuard } from '../services/auth/guard/auth.guard';

export const routes: Routes = [
  {
    component: LandingComponent,
    path: 'login',
    title: 'Login',
  },
  {
    component: HomeComponent,
    path: 'home',
    title: 'Home',
    canActivate: [authGuard()],
  },
  { path: '**', redirectTo: 'home' },
];
