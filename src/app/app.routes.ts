import { Routes } from '@angular/router';
import { LandingComponent } from '../pages/landing/landing.component';
import { authGuard } from '../services/auth/guard/auth.guard';
import { HomeComponent } from '../pages/home/home.component';
import { AddEditTransactionComponent } from '../pages/transaction/add-edit/add-edit-transaction/add-edit-transaction.component';

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
    component: AddEditTransactionComponent,
    path: 'transaction/:MODE/:ID',
    title: 'Add Transaction',
    canActivate: [authGuard()],
  },
  {
    component: AddEditTransactionComponent,
    path: 'transaction/:MODE',
    title: 'Add Transaction',
    canActivate: [authGuard()],
  },
  { path: '**', redirectTo: 'home' },
];
