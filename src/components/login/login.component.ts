import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ILoginForm } from './interface/login.interface';
import { IRegisterRequest } from '../../services/auth/interfaces/register.interface';
import { IAuthenticateRequest } from '../../services/auth/interfaces/authenticate.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  protected form!: FormGroup<ILoginForm>;

  constructor(protected authService: AuthService, protected fb: FormBuilder) {}

  ngOnInit(): void {
    this.formInit();
  }

  ngOnDestroy(): void {}

  protected formInit(): void {
    this.form = this.fb.nonNullable.group<ILoginForm>({
      username: this.fb.nonNullable.control('', []),
      password: this.fb.nonNullable.control('', []),
    });
  }

  protected populateRequest(): IAuthenticateRequest {
    console.log('populating with', this.form.getRawValue());
    return {
      username: this.form.controls.username.value,
      password: this.form.controls.password.value,
    };
  }

  protected test(): void {
    console.log('test event');
  }

  protected submit(): void {
    const req = this.populateRequest();
    console.log('submitting', req);
    this.authService.authenticate(req).subscribe({
      next: (response) => {
        console.log(`access: ${response.access}\nrefresh: ${response.refresh}`);
      },
    });
  }
}
