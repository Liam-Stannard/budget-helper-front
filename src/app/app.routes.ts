import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guard/auth.guard';
import { LandingComponent } from './modules/login/landing/landing.component';
import { RegisterComponent } from './modules/login/register-card/register.component';
import { HomeComponent } from './modules/home/home.component';
import { TransactionPageComponent } from './modules/transaction/components/transaction-page/transaction-page.component';
import { TransactionDetailsComponent } from './modules/transaction/components/transaction-details/transaction-details.component';
import { AccountListWrapperComponent } from './modules/account/components/account-list-wrapper/account-list-wrapper.component';
import { BudgetPageComponent } from './modules/budget/components/budget-page/budget-page.component';
import { AccountDetailsComponent } from './modules/account/components/account-details/account-details.component';

export const routes: Routes = [
  {
    component: LandingComponent,
    path: 'login',
    title: 'Login',
  },
  {
    component: RegisterComponent,
    path: 'register',
    title: 'Register',
  },
  {
    component: HomeComponent,
    path: 'home',
    title: 'Home',
    canActivate: [authGuard()],
  },
  {
    component: TransactionPageComponent,
    path: 'transactions',
    title: 'Transactions',
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
  {
    component: AccountListWrapperComponent,
    path: 'accounts',
    title: 'Accounts',
    canActivate: [authGuard()],
  },
  //TODO - add canDeactivate
  {
    component: AccountDetailsComponent,
    path: 'account/:MODE/:ID',
    title: 'Add Account',
    canActivate: [authGuard()],
  },
  {
    component: AccountDetailsComponent,
    path: 'account/:MODE',
    title: 'Add Account',
    canActivate: [authGuard()],
  },
  {
    component: BudgetPageComponent,
    path: 'budgets',
    title: 'Budgets',
    canActivate: [authGuard()],
  },
  { path: '**', redirectTo: 'home' },
];
