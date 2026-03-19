export type PaymentStatus = 'paid' | 'unpaid' | 'part_paid';

export interface FormData {
  itemId: string;
  quantity: string;
  salePrice: string;
  location: string;
  notes: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
}

export interface InventoryItem {
  id: number;
  "Item Description": string;
  Price: number;
  Quantity: number;
  location: string;
}

export interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
  notes?: string | null;
  payment_status: PaymentStatus;
  amount_paid: number;
}