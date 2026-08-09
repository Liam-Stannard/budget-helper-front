import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountApiService } from './account-api.service';

describe('AccountApiService', () => {
  let service: AccountApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAccountList', () => {
    it('should call the account list endpoint', () => {
      service.getAccountList().subscribe();

      const req = httpTestingController.expectOne('/api/v1/account');

      expect(req.request.method).toBe('GET');

      req.flush({ accountList: [] });
    });
  });

  describe('getAccount', () => {
    it('should call the account by id endpoint', () => {
      service.getAccount('1').subscribe();

      const req = httpTestingController.expectOne('/api/v1/account/id/1');

      expect(req.request.method).toBe('GET');

      req.flush({ account: { id: 1, name: 'Main' } });
    });
  });

  describe('deleteAccount', () => {
    it('should call the delete endpoint', () => {
      service.deleteAccount(1).subscribe();

      const req = httpTestingController.expectOne('/api/v1/account/id/1');

      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });
  });

  describe('putAccount', () => {
    it('should call the update endpoint', () => {
      service.putAccount('1', { id: 1, name: 'Main' }).subscribe();

      const req = httpTestingController.expectOne('/api/v1/account/id/1');

      expect(req.request.method).toBe('PUT');

      req.flush({ account: { id: 1, name: 'Main' } });
    });
  });

  describe('postAccount', () => {
    it('should call the create endpoint', () => {
      service.postAccount({ name: 'Main' }).subscribe();

      const req = httpTestingController.expectOne('/api/v1/account');

      expect(req.request.method).toBe('POST');

      req.flush({ account: { id: 1, name: 'Main' } });
    });
  });
});
