import {
  HttpEvent, HttpHandlerFn, HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import {
  HEADER_AUTHORIZATION,
  TOKEN_PREFIX,
} from '../constants/auth.constants';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService: AuthService = inject(AuthService);

  const access = authService.getAccess();

  if (!access) {
    return next(req);
  }

  const clone = req.clone({
    headers: req.headers.set(HEADER_AUTHORIZATION, TOKEN_PREFIX + access),
  });

  return next(clone);
}
