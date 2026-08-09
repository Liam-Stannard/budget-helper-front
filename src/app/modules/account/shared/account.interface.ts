export type IAccount = {
  id?: number;
  name: string;
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
