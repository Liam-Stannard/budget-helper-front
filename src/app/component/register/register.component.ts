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
import { IRegisterForm } from './interface/register.interface';
import { AuthService } from '../../service/auth/auth.service';
import { IRegisterRequest } from '../../service/auth/interfaces/register.interface';
import { passwordsMatchValidator } from '../../util/validators/validator';

@Component({
  selector: 'app-register-form',
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
export class RegisterFormComponent implements OnInit, OnDestroy {
  protected form!: FormGroup<IRegisterForm>;

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
    this.form = this.fb.nonNullable.group<IRegisterForm>(
      {
        username: this.fb.nonNullable.control('', [
          Validators.required,
          Validators.minLength(3),
        ]),
        password: this.fb.nonNullable.control('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        confirmPassword: this.fb.nonNullable.control('', [
          Validators.required,
        ]),
      },
      { validators: [passwordsMatchValidator] }
    );
  }

  protected createRequest(): IRegisterRequest {
    return {
      username: this.form.controls.username.getRawValue(),
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
            console.error('Registration Failed', err);
          },
        });
    }
  }
}
