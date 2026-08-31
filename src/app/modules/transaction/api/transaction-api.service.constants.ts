// URL
export const URL_API_BASE = '/api/v1/';
export const URL_TRANSACTION_BASE = `${URL_API_BASE}transaction`;
export const URL_TRANSACTION_BY_ID = `${URL_TRANSACTION_BASE}/id/`;

// Pagination
/** The backend caps `size` at this value; use it to minimize round trips when paging through results. */
export const MAX_TRANSACTION_PAGE_SIZE = 200;
/**
 * Max number of follow-up page requests fired concurrently by `TransactionListAllService`.
 * Chosen to match the typical browser per-origin HTTP/1.1 connection limit (Chrome/Firefox
 * default to 6), since requesting more than that in parallel offers no real client-side
 * speed benefit -- the extras just queue in the browser anyway -- while still bounding how
 * many simultaneous requests can hit the backend for large date ranges.
 */
export const TRANSACTION_PAGE_FETCH_CONCURRENCY = 6;
