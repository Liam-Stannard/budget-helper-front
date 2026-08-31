import { FormControl } from '@angular/forms';
import { Category } from '../../../transaction/shared/transaction.types';

export interface ITrendDateRangeForm {
  from: FormControl<Date | undefined>;
  to: FormControl<Date | undefined>;
  /** `undefined` means "all accounts". */
  accountId: FormControl<number | undefined>;
  /** Empty array means "all categories" - the backend only supports filtering to a single
   * category per request, so this is applied client-side against the already-fetched range
   * rather than driving a second/separate fetch. */
  categories: FormControl<Category[]>;
}
