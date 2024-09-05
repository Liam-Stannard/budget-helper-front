import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should call the register end point', () => {});

    it('should return an observable and call storeTokens with the response on success', () => {});

    it('should return an observable and send an alert on error', () => {});
  });

  describe('authenticate', () => {
    it('should call the authenticate end point', () => {});

    it('should return an observable and call storeTokens with the response on success', () => {});

    it('should return an observable and send an alert on error', () => {});
  });

  describe('logout', () => {
    it('should call clearTokens', () => {});
  });

  describe('isLoggedIn', () => {
    it('should return true if now is before token expirey', () => {});
    it('should return false if now is after token expirey', () => {});
    it('should return false if expiresAt returns null', () => {});
  });

  describe('expiresAt', () => {
    it('it should return the exirey time if there is an access token', () => {});
    it('it should return null if getAccess returns null', () => {});
    it('it should return null if null is returned from decoding the token', () => {});
  });

  describe('getAccess', () => {
    it('should get the item from key LOCAL_STOREAGE_KEY_ACCESS', () => {});
  });

  describe('getRefresh', () => {
    it('should get the item from key LOCAL_STORAGE_KEY_REFRESH ', () => {});
  });

  describe('storeTokens', () => {
    it('it should store the access token in localStorage under key LOCAL_STOREAGE_KEY_ACCESS', () => {});
    it('it should store the refresh token in localStorage under key LOCAL_STOREAGE_KEY_refresh', () => {});
  });

  describe('clearTokens', () => {
    it('it should remove the access token from localStorage', () => {});
    it('it should remove the refresh token from localStorage', () => {});
  });
});
