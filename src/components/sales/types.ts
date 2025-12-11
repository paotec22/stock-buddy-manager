export interface FormData {
  itemId: string;
  quantity: string;
  salePrice: string;
  location: string;
  notes: string;
}

export interface InventoryItem {
  id: number;
  "Item Description": string;
  Price: number;
  Quantity: number;
  location: string;
}