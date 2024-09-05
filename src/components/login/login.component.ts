import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ILoginForm } from './interface/login.interface';
import { IAuthenticateRequest } from '../../services/auth/interfaces/authenticate.interface';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  protected form!: FormGroup<ILoginForm>;

  constructor(
    protected authService: AuthService,
    protected fb: FormBuilder,
    protected router: Router
  ) {}

  ngOnInit(): void {
    this.formInit();
  }

  ngOnDestroy(): void {}

  protected formInit(): void {
    this.form = this.fb.nonNullable.group<ILoginForm>({
      username: this.fb.nonNullable.control('', [Validators.required]),
      password: this.fb.nonNullable.control('', [Validators.required]),
    });
  }

  protected populateRequest(): IAuthenticateRequest {
    return {
      username: this.form.controls.username.getRawValue(),
      password: this.form.controls.password.getRawValue(),
    };
  }

  protected login(): void {
    if (this.form.valid) {
      this.authService.authenticate(this.populateRequest()).subscribe({
        next: () => {
          this.router.navigate(['home']);
        },
        error: (err) => {
          console.error('Login Failed', err);
        },
      });
    }
  }
}
