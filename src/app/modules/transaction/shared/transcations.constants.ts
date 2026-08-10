import { MenuOption } from '../../../shared/interface/menu-options.interfaces';
import { Category } from './transaction.types';

export const CATEGORY_OPTIONS: MenuOption<string, Category>[] = [
  {
    view: 'Food',
    value: 'FOOD',
  },
  {
    view: 'Bill',
    value: 'BILL',
  },
  {
    view: 'Subscription',
    value: 'SUBSCRIPTION',
  },
  {
    view: 'Clothing',
    value: 'CLOTHING',
  },
  {
    view: 'Income',
    value: 'INCOME',
  },
];
