export interface IShoppingListsResponse {
  lists: Array<IShoppingList>;
}

export interface IShoppingList {
  id: number;
  name: string;
  items: Array<IShoppingItem>;
}

export interface IShoppingItem {
  id: number;
  name: string;
}
