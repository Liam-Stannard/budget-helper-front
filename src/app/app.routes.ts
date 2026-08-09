import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guard/auth.guard';
import { LandingComponent } from './modules/login/landing/landing.component';
import { HomeComponent } from './modules/transaction/components/home/home.component';
import { TransactionDetailsComponent } from './modules/transaction/components/transaction-details/transaction-details.component';

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
  //TODO - add canDeactivate
  {
    component: TransactionDetailsComponent,
    path: 'transaction/:MODE/:ID',
    title: 'Add Transaction',
    canActivate: [authGuard()],
  },
  {
    component: TransactionDetailsComponent,
    path: 'transaction/:MODE',
    title: 'Add Transaction',
    canActivate: [authGuard()],
  },
  { path: '**', redirectTo: 'home' },
];
