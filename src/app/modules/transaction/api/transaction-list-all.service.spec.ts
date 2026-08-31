import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TransactionListAllService } from './transaction-list-all.service';
import {
  IGetTransactionListResponse,
  ITransaction,
} from '../shared/transaction.interface';

function makeTransaction(id: number): ITransaction {
  return {
    id,
    title: `transaction ${id}`,
    amount: '10.00',
    date: '2026-01-01',
    category: 'FOOD',
    account: { id: 1, name: 'Main' },
  };
}

function pageResponse(
  ids: number[],
  totalElements: number,
  totalPages: number
): IGetTransactionListResponse {
  return {
    transactionList: ids.map(makeTransaction),
    totalElements,
    totalPages,
  };
}

describe('TransactionListAllService', () => {
  let service: TransactionListAllService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionListAllService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make a single request and return its result when there is only one page', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions({ from: '2026-01-01' }).subscribe((res) => {
      result = res;
    });

    const requests = httpTestingController.match(
      (r) => r.url === '/api/v1/transaction'
    );
    expect(requests.length).toBe(1);
    expect(requests[0].request.params.get('page')).toBe('0');
    expect(requests[0].request.params.get('size')).toBe('200');
    expect(requests[0].request.params.get('from')).toBe('2026-01-01');
    requests[0].flush(pageResponse([1, 2], 2, 1));

    expect(result).toEqual(pageResponse([1, 2], 2, 1));
  });

  it('should fetch every page and merge results in order when there are multiple pages', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    const firstReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    firstReq.flush(pageResponse([1, 2], 5, 3));

    const secondReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '1'
    );
    const thirdReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '2'
    );

    // flush out of arrival order to confirm merge order follows page number, not response order
    thirdReq.flush(pageResponse([5], 5, 3));
    secondReq.flush(pageResponse([3, 4], 5, 3));

    expect(result?.transactionList.map((t) => t.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result?.totalElements).toBe(5);
    expect(result?.totalPages).toBe(3);
  });

  it('should make a single request and return an empty list when there are no results', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    const requests = httpTestingController.match(
      (r) => r.url === '/api/v1/transaction'
    );
    expect(requests.length).toBe(1);
    requests[0].flush({ transactionList: [], totalElements: 0, totalPages: 0 });

    expect(result).toEqual({
      transactionList: [],
      totalElements: 0,
      totalPages: 0,
    });
  });

  it('should not stop early when there are many pages', () => {
    const totalPages = 6;
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    for (let page = 0; page < totalPages; page++) {
      const req = httpTestingController.expectOne(
        (r) =>
          r.url === '/api/v1/transaction' &&
          r.params.get('page') === page.toString()
      );
      req.flush(pageResponse([page], totalPages, totalPages));
    }

    httpTestingController.verify();
    expect(result?.transactionList.map((t) => t.id)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(result?.totalPages).toBe(totalPages);
  });

  it('should propagate an error (not hang or emit a partial merge) when one of several concurrent follow-up pages fails', () => {
    let result: IGetTransactionListResponse | undefined;
    let error: unknown;
    let completed = false;

    service.getAllTransactions().subscribe({
      next: (res) => (result = res),
      error: (err) => (error = err),
      complete: () => (completed = true),
    });

    const firstReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    firstReq.flush(pageResponse([1, 2], 10, 5));

    const page1Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '1'
    );
    const page2Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '2'
    );
    const page3Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '3'
    );
    const page4Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '4'
    );

    // page 2 of the 5 fails with a server error while its siblings are still outstanding
    page2Req.flush('Server error', {
      status: 500,
      statusText: 'Server Error',
    });

    // the overall Observable must error out, not emit a partial/incomplete merge
    expect(error).toBeTruthy();
    expect(result).toBeUndefined();
    expect(completed).toBe(false);

    // the sibling in-flight requests must not be left dangling forever: forkJoin
    // unsubscribes from them as soon as one source errors, which HttpClient
    // surfaces as a cancelled TestRequest rather than a request that needs
    // manual flushing.
    expect(page1Req.cancelled).toBe(true);
    expect(page3Req.cancelled).toBe(true);
    expect(page4Req.cancelled).toBe(true);

    // no dangling/outstanding requests left behind by the error path
    httpTestingController.verify();
  });

  it('should send the same from/to/sort filter params on every follow-up page as page 0', () => {
    service
      .getAllTransactions({ from: '2026-01-01', to: '2026-06-30', sort: 'date,desc' })
      .subscribe();

    const firstReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    expect(firstReq.request.params.get('from')).toBe('2026-01-01');
    expect(firstReq.request.params.get('to')).toBe('2026-06-30');
    expect(firstReq.request.params.get('sort')).toBe('date,desc');
    firstReq.flush(pageResponse([1], 3, 3));

    const secondReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '1'
    );
    const thirdReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '2'
    );

    for (const req of [secondReq, thirdReq]) {
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-06-30');
      expect(req.request.params.get('sort')).toBe('date,desc');
      expect(req.request.params.get('size')).toBe('200');
    }

    secondReq.flush(pageResponse([2], 3, 3));
    thirdReq.flush(pageResponse([3], 3, 3));
  });

  it('should merge in page-index order even when pages resolve in a fully adversarial (reverse) order', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    const firstReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    firstReq.flush(pageResponse([1, 2], 8, 4));

    const page1Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '1'
    );
    const page2Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '2'
    );
    const page3Req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '3'
    );

    // flush in strict reverse arrival order: 3, then 2, then 1
    page3Req.flush(pageResponse([7, 8], 8, 4));
    page2Req.flush(pageResponse([5, 6], 8, 4));
    page1Req.flush(pageResponse([3, 4], 8, 4));

    expect(result?.transactionList.map((t) => t.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('should not over- or under-fetch when page 0 returns exactly a full page (200 items) and the backend reports totalPages accordingly', () => {
    // NOTE: this repo's `totalPages` is computed server-side and simply trusted
    // by the frontend (see TransactionApiService.getTransactionList / the
    // IGetTransactionListResponse shape) -- the frontend never derives
    // totalPages from totalElements/size itself, so there is no client-side
    // off-by-one to reproduce here. This test instead pins down that the
    // utility behaves correctly for both plausible backend conventions for an
    // exactly-full first page: totalPages === 1 (all 200 items fit on page 0,
    // no more pages) and totalPages === 2 (an off-by-one convention that
    // implies an existing-but-empty page 1).
    const fullPageIds = Array.from({ length: 200 }, (_, i) => i + 1);

    // Convention A: exactly 200 items reported as a single page.
    let resultA: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => (resultA = res));
    const reqA = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    reqA.flush(pageResponse(fullPageIds, 200, 1));
    expect(resultA?.transactionList.length).toBe(200);
    httpTestingController.verify();

    // Convention B: exactly 200 items reported as totalPages === 2 (second
    // page happens to be empty) -- the utility should still follow it and
    // fetch page 1, merging in an empty page without dropping anything.
    let resultB: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => (resultB = res));
    const reqB0 = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    reqB0.flush(pageResponse(fullPageIds, 200, 2));
    const reqB1 = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '1'
    );
    reqB1.flush(pageResponse([], 200, 2));
    expect(resultB?.transactionList.length).toBe(200);
  });

  it('should work when no from/to bounds are given, only a sort param', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions({ sort: 'date,desc' }).subscribe((res) => {
      result = res;
    });

    const req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    expect(req.request.params.has('from')).toBe(false);
    expect(req.request.params.has('to')).toBe(false);
    expect(req.request.params.get('sort')).toBe('date,desc');
    req.flush(pageResponse([1], 1, 1));

    expect(result?.transactionList.map((t) => t.id)).toEqual([1]);
  });

  it('should bound the concurrency of follow-up page requests instead of firing them all at once', () => {
    // 10 total pages -> 9 follow-up requests, which must be batched rather
    // than all fired simultaneously (regression test for unbounded forkJoin).
    const totalPages = 10;
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    const firstReq = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    firstReq.flush(pageResponse([0], totalPages, totalPages));

    // only the concurrency limit's worth of follow-up requests should be
    // in flight at once -- not all 9 remaining pages simultaneously.
    const inFlightAfterFirstBatch = httpTestingController.match(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') !== '0'
    );
    expect(inFlightAfterFirstBatch.length).toBeGreaterThan(0);
    expect(inFlightAfterFirstBatch.length).toBeLessThan(totalPages - 1);

    // flush the first batch and confirm the remaining pages only get
    // requested afterwards (proving requests are queued, not all fired up
    // front and merely left unflushed).
    const firstBatchPages = inFlightAfterFirstBatch.map((r) =>
      Number(r.request.params.get('page'))
    );
    inFlightAfterFirstBatch.forEach((req) => {
      const page = Number(req.request.params.get('page'));
      req.flush(pageResponse([page], totalPages, totalPages));
    });

    const remainingPagesToFetch = Array.from(
      { length: totalPages - 1 },
      (_, i) => i + 1
    ).filter((page) => !firstBatchPages.includes(page));

    for (const page of remainingPagesToFetch) {
      const req = httpTestingController.expectOne(
        (r) =>
          r.url === '/api/v1/transaction' &&
          r.params.get('page') === page.toString()
      );
      req.flush(pageResponse([page], totalPages, totalPages));
    }

    expect(result?.transactionList.map((t) => t.id)).toEqual(
      Array.from({ length: totalPages }, (_, i) => i)
    );
  });

  it('should work when called with no params at all (unbounded fetch of everything)', () => {
    let result: IGetTransactionListResponse | undefined;
    service.getAllTransactions().subscribe((res) => {
      result = res;
    });

    const req = httpTestingController.expectOne(
      (r) => r.url === '/api/v1/transaction' && r.params.get('page') === '0'
    );
    expect(req.request.params.has('from')).toBe(false);
    expect(req.request.params.has('to')).toBe(false);
    expect(req.request.params.has('sort')).toBe(false);
    req.flush(pageResponse([1], 1, 1));

    expect(result?.transactionList.map((t) => t.id)).toEqual([1]);
  });
});
