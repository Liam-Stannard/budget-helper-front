import { Component } from '@angular/core';
import { AccountCardComponent } from '../account-card/account-card.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AccountCardComponent],
  templateUrl: './account-details.component.html',
  styleUrl: './account-details.component.scss',
})
export class AccountDetailsComponent {}
