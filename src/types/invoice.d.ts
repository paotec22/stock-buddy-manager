export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  user_id: string;
  created_at: string;
  items?: InvoiceItem[];
}