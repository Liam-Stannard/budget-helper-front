import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ILoginForm } from './login.interface';
import { AuthService } from '../../../core/auth/auth.service';
import { IAuthenticateRequest } from '../../../core/auth/interfaces/authenticate.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
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

  destroyRef = inject(DestroyRef);

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

  protected createRequest(): IAuthenticateRequest {
    return {
      username: this.form.controls.username.getRawValue(),
      password: this.form.controls.password.getRawValue(),
    };
  }

  protected login(): void {
    if (this.form.valid) {
      this.authService
        .authenticate(this.createRequest())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
