import { SelectOption } from '../../../interface/interfaces';
import { Category } from '../type/transaction.type';

export const CATEGORY_OPTIONS: SelectOption<string, Category>[] = [
  {
    view: 'Food',
    value: 'FOOD',
  },
  {
    view: 'Bill',
    value: 'Bill',
  },
  {
    view: 'Subscription',
    value: 'Subscription',
  },
  {
    view: 'Clothing',
    value: 'Clothing',
  },
];
