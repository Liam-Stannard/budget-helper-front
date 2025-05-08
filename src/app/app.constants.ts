export type Mode = 'edit' | 'add' | 'view';

export class APP_CONSTANTS {
  static readonly MODE_EDIT: Mode = 'edit';
  static readonly MODE_ADD: Mode = 'add';
  static readonly MODE_VIEW: Mode = 'view';

  static readonly ACTION_EDIT: string = 'ACTION_EDIT';
  static readonly ACTION_DELETE: string = 'ACTION_DELETE';
}
