import { of } from 'rxjs';

export class MockAuthService {
  authenticate = of(true);
  isLoggedIn = jest.fn(() => true);
}

export class MockApiService {
  getTransactions = jest.fn(() =>
    of({
      transactions: [],
    })
  );
}
