import { MenuOption } from '../../../shared/interface/menu-options.interfaces';
import { Category } from './transaction.types';

export const CATEGORY_OPTIONS: MenuOption<string, Category>[] = [
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
