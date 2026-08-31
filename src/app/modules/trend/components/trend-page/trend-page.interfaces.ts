import { FormControl } from '@angular/forms';

export interface ITrendDateRangeForm {
  from: FormControl<Date | undefined>;
  to: FormControl<Date | undefined>;
}
