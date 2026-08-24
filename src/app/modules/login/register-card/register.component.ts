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
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IRegisterForm } from './register.interface';
import { AuthService } from '../../../core/auth/auth.service';
import { IRegisterRequest } from '../../../core/auth/interfaces/register.interface';
import { ErrorNotificationService } from '../../../core/services/error-notification.service';
import { passwordsMatchValidator } from '../../../shared/validators/validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  protected form!: FormGroup<IRegisterForm>;

  destroyRef = inject(DestroyRef);

  constructor(
    protected authService: AuthService,
    protected fb: FormBuilder,
    protected router: Router,
    private errorNotifier: ErrorNotificationService
  ) {}

  ngOnInit(): void {
    this.formInit();
  }

  ngOnDestroy(): void {}

  protected formInit(): void {
    this.form = this.fb.nonNullable.group<IRegisterForm>(
      {
        username: this.fb.nonNullable.control('', [Validators.required]),
        email: this.fb.nonNullable.control('', [
          Validators.required,
          Validators.email,
        ]),
        password: this.fb.nonNullable.control('', [Validators.required]),
        confirmPassword: this.fb.nonNullable.control('', [
          Validators.required,
        ]),
      },
      {
        validators: [passwordsMatchValidator('password', 'confirmPassword')],
      }
    );
  }

  protected createRequest(): IRegisterRequest {
    return {
      username: this.form.controls.username.getRawValue(),
      role: 'ROLE_USER',
      email: this.form.controls.email.getRawValue(),
      password: this.form.controls.password.getRawValue(),
    };
  }

  protected register(): void {
    if (this.form.valid) {
      this.authService
        .register(this.createRequest())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.router.navigate(['home']);
          },
          error: (err) => {
            this.errorNotifier.notify('Unable to create account', err);
          },
        });
    }
  }
}
