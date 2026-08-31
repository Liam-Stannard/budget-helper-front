import { Injectable } from '@angular/core';
import { Observable, from, map, mergeMap, of, switchMap, toArray } from 'rxjs';
import { TransactionApiService } from './transaction-api.service';
import {
  MAX_TRANSACTION_PAGE_SIZE,
  TRANSACTION_PAGE_FETCH_CONCURRENCY,
} from './transaction-api.service.constants';
import {
  IGetTransactionListResponse,
  ITransactionListParams,
} from '../shared/transaction.interface';

export type IGetAllTransactionsParams = Omit<
  ITransactionListParams,
  'page' | 'size'
>;

/**
 * Fetches every page of `GET /api/v1/transaction` for the given filters and
 * merges the results into a single response, so callers never have to worry
 * about the backend's per-request page-size cap silently truncating large
 * date ranges.
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionListAllService {
  constructor(private transactionApiService: TransactionApiService) {}

  getAllTransactions(
    params: IGetAllTransactionsParams = {}
  ): Observable<IGetTransactionListResponse> {
    const size = MAX_TRANSACTION_PAGE_SIZE;

    return this.transactionApiService
      .getTransactionList({ ...params, page: 0, size })
      .pipe(
        switchMap((firstPage) => {
          if (firstPage.totalPages <= 1) {
            return of(firstPage);
          }

          const remainingPageIndexes: number[] = [];
          for (let page = 1; page < firstPage.totalPages; page++) {
            remainingPageIndexes.push(page);
          }

          // Bound the concurrency of the follow-up page requests: firing every
          // remaining page at once (as a raw forkJoin over an unbounded array
          // would) can burst dozens of simultaneous requests at the backend for
          // a large date range, with no real client-side benefit since browsers
          // cap per-origin concurrent connections anyway. mergeMap's concurrency
          // limit still errors out (and unsubscribes any in-flight siblings)
          // the same way forkJoin does if any one page fails, since an inner
          // error tears down the whole merged subscription.
          return from(remainingPageIndexes).pipe(
            mergeMap(
              (page) =>
                this.transactionApiService
                  .getTransactionList({ ...params, page, size })
                  .pipe(map((response) => ({ page, response }))),
              TRANSACTION_PAGE_FETCH_CONCURRENCY
            ),
            toArray(),
            map((remainingPages) => {
              // mergeMap does not preserve source order in its emissions, so
              // sort by page index (independent of arrival/completion order)
              // before merging into the final result.
              const orderedRemainingPages = remainingPages
                .sort((a, b) => a.page - b.page)
                .map(({ response }) => response);

              return {
                transactionList: [
                  firstPage.transactionList,
                  ...orderedRemainingPages.map(
                    (page) => page.transactionList
                  ),
                ].flat(),
                totalElements: firstPage.totalElements,
                totalPages: firstPage.totalPages,
              };
            })
          );
        })
      );
  }
}
