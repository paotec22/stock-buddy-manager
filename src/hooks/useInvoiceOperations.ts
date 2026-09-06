import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row'];
export type NewInvoiceItem = Omit<InvoiceItemRow, 'id' | 'created_at' | 'invoice_id' | 'item_id'>;

const VAT_RATE = 7.5; // Nigerian VAT rate

export const useInvoiceOperations = (
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  customerEmail: string,
  invoiceNumber: string,
  invoiceDate: Date,
  dueDate: Date,
  notes: string,
  items: NewInvoiceItem[],
  userId: string | undefined,
  includeVat: boolean = false,
  discountPercent: number = 0,
  customerId: string | null = null,
  onLoadInvoice?: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    notes: string;
    items: NewInvoiceItem[];
    includeVat: boolean;
    discountPercent: number;
    selectedCustomerId: string | null;
  }) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const navigate = useNavigate();

  const validItems = items.filter(item => 
    item.description && item.quantity > 0
  );

  const calculateTotals = () => {
    const subtotal = validItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = includeVat ? (afterDiscount * VAT_RATE) / 100 : 0;
    const totalAmount = afterDiscount + taxAmount;
    
    return {
      subtotal,
      tax_rate: includeVat ? VAT_RATE : 0,
      tax_amount: taxAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      total: subtotal,
      invoice_number: invoiceNumber || `INV-${format(new Date(), "yyyyMMddHHmmss")}`
    };
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be logged in to save invoices");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    if (validItems.length === 0) {
      toast.error("Please add at least one complete item to the invoice");
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculateTotals();
      const formattedInvoiceDate = format(invoiceDate || new Date(), "yyyy-MM-dd");
      const formattedDueDate = format(dueDate || addDays(new Date(), 14), "yyyy-MM-dd");

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ 
          customer_name: customerName, 
          customer_phone: customerPhone,
          customer_address: customerAddress,
          customer_id: customerId,
          user_id: userId,
          invoice_number: totals.invoice_number,
          invoice_date: formattedInvoiceDate,
          due_date: formattedDueDate,
          notes: notes,
          subtotal: totals.subtotal,
          tax_rate: totals.tax_rate,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = validItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        invoice_id: invoice.id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success(`Invoice ${totals.invoice_number} saved successfully!`);
      fetchSavedInvoices();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info("Preparing print/PDF preview...");
    window.print();
  };

  const fetchSavedInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedInvoices(data || []);
    } catch (error) {
      console.error("Error fetching saved invoices:", error);
      toast.error("Failed to fetch saved invoices");
    }
  };

  const handleShowSavedInvoices = async () => {
    await fetchSavedInvoices();
    setIsModalOpen(true);
  };

  const handleDeleteSavedInvoice = async (invoiceId: number) => {
    try {
      // Delete invoice items first
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      // Delete invoice
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;

      setSavedInvoices(prev => prev.filter(i => i.id !== invoiceId));
      toast.success("Invoice deleted");
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleLoadInvoice = async (invoice: Invoice) => {
    setLoadingInvoiceId(invoice.id);
    try {
      const { data: itemsData, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;

      const loadedItems: NewInvoiceItem[] = (itemsData || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        amount: Number(item.amount)
      }));

      const invDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date();
      const dDate = invoice.due_date ? new Date(invoice.due_date) : addDays(new Date(), 14);

      if (onLoadInvoice) {
        onLoadInvoice({
          customerName: invoice.customer_name || "",
          customerPhone: invoice.customer_phone || "",
          customerAddress: invoice.customer_address || "",
          customerEmail: "",
          invoiceNumber: invoice.invoice_number || `INV-${Date.now()}`,
          invoiceDate: invDate,
          dueDate: dDate,
          notes: invoice.notes || "",
          items: loadedItems,
          includeVat: Number(invoice.tax_rate) > 0,
          discountPercent: 0,
          selectedCustomerId: invoice.customer_id || null
        });
        toast.success(`Invoice ${invoice.invoice_number} loaded into editor`);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice items");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handlePrintSavedInvoice = async (invoice: Invoice) => {
    try {
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      const itemsList = itemsData || [];

      const itemsHtml = itemsList.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-size: 13px;">${item.description}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-family: monospace;">₦${Number(item.unit_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600; font-family: monospace;">₦${Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const printContents = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 24px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #081def; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 800; color: #081def; margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; }
            .info-block h4 { margin: 0 0 6px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-block p { margin: 2px 0; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
            .totals { margin-left: auto; width: 280px; font-size: 13px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
            .totals-row.grand { border-top: 2px solid #081def; border-bottom: none; font-size: 16px; font-weight: 700; color: #081def; padding-top: 10px; }
            .bank-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; font-size: 12px; color: #1e40af; margin-top: 24px; }
            .footer { margin-top: 32px; background: #081def; color: #ffffff; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <h1 class="title">INVOICE</h1>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Puido Smart Solutions Ltd</p>
              </div>
              <div style="text-align: right;">
                <p style="margin:0; font-size: 16px; font-weight: 700;"># ${invoice.invoice_number}</p>
                <p style="margin:4px 0 0 0; font-size: 12px; color: #64748b;">Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-block">
                <h4>Invoice To</h4>
                <p style="font-size: 15px; font-weight: 700; color: #0f172a;">${invoice.customer_name || 'Valued Customer'}</p>
                ${invoice.customer_phone ? `<p>Phone: ${invoice.customer_phone}</p>` : ''}
                ${invoice.customer_address ? `<p>Address: ${invoice.customer_address}</p>` : ''}
              </div>
              <div class="info-block" style="text-align: right;">
                <h4>Payment Details</h4>
                <p>Status: <span style="color: #16a34a; font-weight: 700;">ISSUED</span></p>
                ${invoice.due_date ? `<p>Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₦${Number(invoice.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              ${Number(invoice.tax_amount) > 0 ? `
                <div class="totals-row">
                  <span>VAT (${invoice.tax_rate}%):</span>
                  <span>₦${Number(invoice.tax_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              ` : ''}
              <div class="totals-row grand">
                <span>Total Amount:</span>
                <span>₦${Number(invoice.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div class="bank-card">
              <p style="margin: 0 0 4px 0; font-weight: 700; text-transform: uppercase;">Payment Method (Bank Transfer):</p>
              <p style="margin: 2px 0;">Bank Name: <strong>Globus Bank</strong></p>
              <p style="margin: 2px 0;">Account Number: <strong>1000145362</strong></p>
              <p style="margin: 2px 0;">Account Name: <strong>Puido Smart Solution Ltd.</strong></p>
            </div>

            <div class="footer">
              <span>Phone: 07035339641, 08131927116</span>
              <span>41, Olowu Street, Ikeja, Lagos</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `;

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(printContents);
        newWindow.document.close();
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to generate print view");
    }
  };

  return {
    isSubmitting,
    savedInvoices,
    isModalOpen,
    setIsModalOpen,
    validItems,
    calculateTotals,
    handleSubmit,
    handlePrint,
    handleDownload,
    handleShowSavedInvoices,
    handlePrintSavedInvoice,
    handleLoadInvoice,
    handleDeleteSavedInvoice,
    loadingInvoiceId
  };
};
