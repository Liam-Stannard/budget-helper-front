import { SelectOption } from '../../../interface/interfaces';
import { Category } from '../type/transaction.type';

export const CATEGORY_OPTIONS: SelectOption<Category, Category>[] = [
  {
    view: 'Food',
    value: 'Food',
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
