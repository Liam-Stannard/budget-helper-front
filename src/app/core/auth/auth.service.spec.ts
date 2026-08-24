import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import dayjs from 'dayjs';

import { AuthService } from './auth.service';
import {
  LOCAL_STORAGE_KEY_ACCESS,
  LOCAL_STORAGE_KEY_REFRESH,
  URL_AUTHENTICATE,
  URL_REGISTER,
} from './constants/auth.constants';
import { IAuthenticateResponse } from './interfaces/authenticate.interface';
import { IRegisterResponse } from './interfaces/register.interface';

function encodeBase64Url(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createToken(payload: Record<string, unknown> = {}): string {
  return `header.${encodeBase64Url(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should call the register end point', () => {
      const registerResponse: IRegisterResponse = {
        access: createToken(),
        refresh: 'refresh-token',
      };

      service
        .register({ username: 'user', password: 'pass' })
        .subscribe((response) => {
          expect(response).toEqual(registerResponse);
        });

      const req = httpTestingController.expectOne(URL_REGISTER);

      expect(req.request.method).toBe('POST');

      req.flush(registerResponse);
    });
  });

  describe('authenticate', () => {
    it('should call the authenticate end point', () => {
      const authenticateResponse: IAuthenticateResponse = {
        access: createToken({ exp: dayjs().add(1, 'hour').unix() }),
        refresh: 'refresh-token',
      };

      service.authenticate({ username: 'user', password: 'pass' }).subscribe();

      const req = httpTestingController.expectOne(URL_AUTHENTICATE);

      expect(req.request.method).toBe('POST');

      req.flush(authenticateResponse);
    });

    it('should return an observable and call storeTokens with the response on success', () => {
      const authenticateResponse: IAuthenticateResponse = {
        access: createToken({ exp: dayjs().add(1, 'hour').unix() }),
        refresh: 'refresh-token',
      };

      service.authenticate({ username: 'user', password: 'pass' }).subscribe();

      httpTestingController
        .expectOne(URL_AUTHENTICATE)
        .flush(authenticateResponse);

      expect(localStorage.getItem(LOCAL_STORAGE_KEY_ACCESS)).toBe(
        authenticateResponse.access,
      );
      expect(localStorage.getItem(LOCAL_STORAGE_KEY_REFRESH)).toBe(
        authenticateResponse.refresh,
      );
      expect(service.loggedIn()).toBe(true);
    });

    it('should return an observable and send an alert on error', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      service.authenticate({ username: 'user', password: 'pass' }).subscribe({
        error: () => {},
      });

      httpTestingController
        .expectOne(URL_AUTHENTICATE)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(alertSpy).toHaveBeenCalledWith(
        'Invalid user and password, please try again',
      );
    });
  });

  describe('logout', () => {
    it('should call clearTokens', () => {
      const clearTokensSpy = jest.spyOn(service, 'clearTokens');

      service.logout();

      expect(clearTokensSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate to login', () => {
      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);

      service.logout();

      expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if now is before token expirey', () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_ACCESS,
        createToken({ exp: dayjs().add(1, 'hour').unix() }),
      );

      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false if now is after token expirey', () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_ACCESS,
        createToken({ exp: dayjs().subtract(1, 'hour').unix() }),
      );

      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return false if expiresAt returns null', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('expiresAt', () => {
    it('it should return the exirey time if there is an access token', () => {
      const exp = dayjs().add(1, 'hour').unix();

      localStorage.setItem(LOCAL_STORAGE_KEY_ACCESS, createToken({ exp }));

      expect(service.expriesAt()?.unix()).toBe(exp);
    });

    it('it should return null if getAccess returns null', () => {
      expect(service.expriesAt()).toBeUndefined();
    });

    it('it should return null if null is returned from decoding the token', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCESS, createToken({}));

      expect(service.expriesAt()).toBeUndefined();
    });
  });

  describe('getAccess', () => {
    it('should get the item from key LOCAL_STOREAGE_KEY_ACCESS', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCESS, 'access-token');

      expect(service.getAccess()).toBe('access-token');
    });
  });

  describe('getRefresh', () => {
    it('should get the item from key LOCAL_STORAGE_KEY_REFRESH ', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY_REFRESH, 'refresh-token');

      expect(service.getRefresh()).toBe('refresh-token');
    });
  });

  describe('storeTokens', () => {
    const response: IAuthenticateResponse = {
      access: createToken({ exp: dayjs().add(1, 'hour').unix() }),
      refresh: 'refresh-token',
    };

    it('it should store the access token in localStorage under key LOCAL_STOREAGE_KEY_ACCESS', () => {
      (
        service as unknown as {
          storeTokens: (r: IAuthenticateResponse) => void;
        }
      ).storeTokens(response);

      expect(localStorage.getItem(LOCAL_STORAGE_KEY_ACCESS)).toBe(
        response.access,
      );
    });

    it('it should store the refresh token in localStorage under key LOCAL_STOREAGE_KEY_refresh', () => {
      (
        service as unknown as {
          storeTokens: (r: IAuthenticateResponse) => void;
        }
      ).storeTokens(response);

      expect(localStorage.getItem(LOCAL_STORAGE_KEY_REFRESH)).toBe(
        'refresh-token',
      );
    });
  });

  describe('clearTokens', () => {
    beforeEach(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCESS, 'access-token');
      localStorage.setItem(LOCAL_STORAGE_KEY_REFRESH, 'refresh-token');
    });

    it('it should remove the access token from localStorage', () => {
      service.clearTokens();

      expect(localStorage.getItem(LOCAL_STORAGE_KEY_ACCESS)).toBeNull();
    });

    it('it should remove the refresh token from localStorage', () => {
      service.clearTokens();

      expect(localStorage.getItem(LOCAL_STORAGE_KEY_REFRESH)).toBeNull();
    });

    it('should set loggedIn to false', () => {
      service.clearTokens();

      expect(service.loggedIn()).toBe(false);
    });
  });
});
