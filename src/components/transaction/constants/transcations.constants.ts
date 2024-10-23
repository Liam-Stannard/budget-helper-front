import { SelectOption } from '../../../interface/interfaces';
import { Category } from '../types/types';

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
