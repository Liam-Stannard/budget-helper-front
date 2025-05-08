import { Routes } from '@angular/router';
import { authGuard } from './service/auth/guard/auth.guard';
import { HomeComponent } from './page/home/home.component';
import { TransactionDetailsComponent } from './page/transaction/transaction-details/transaction-details.component';
import { LandingComponent } from './page/landing/landing.component';

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
