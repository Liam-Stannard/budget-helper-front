export type IAccount = {
  id?: number;
  name: string;
  /** Editable; defaults to "0.0000" server-side if omitted. */
  startingBalance?: string;
  /** Response-only: startingBalance plus every transaction against the account, computed
   * server-side on every read. Sending this back on a PUT/POST has no effect. */
  currentBalance?: string;
};

export type IGetAccountListResponse = {
  accountList: IAccount[];
};
export type IGetAccountResponse = {
  account: IAccount;
};

export type IPutAccountRequest = {
  account: IAccount;
};

export type IPostAccountRequest = {
  account: IAccount;
};

export type IPostPutAccountResponse = {
  account: IAccount;
};
