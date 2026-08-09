export const TRANSACTION_LIST_TABLE_COLUMNS = [
  'col-title',
  'col-account',
  'col-amount',
  'col-date',
  'col-category',
  'col-actions',
];
export interface IMatMenuButtonActionEvent<T> {
  action: string;
  item: T;
}
