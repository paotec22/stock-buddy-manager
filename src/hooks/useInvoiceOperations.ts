import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import type { Currency } from "@/components/invoice/CurrencyChanger";
import { printInvoiceDocument, exportInvoiceToPdf } from "@/utils/invoicePrint";

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
  }) => void,
  amountPaid: number = 0,
  selectedCurrency?: Currency
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
    const balance = Math.max(0, totalAmount - amountPaid);
    const isPaidInFull = totalAmount > 0 && amountPaid >= totalAmount;
    
    return {
      subtotal,
      tax_rate: includeVat ? VAT_RATE : 0,
      tax_amount: taxAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      total: subtotal,
      amount_paid: amountPaid,
      balance,
      isPaidInFull,
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

      const docType = totals.isPaidInFull ? "Receipt" : "Invoice";
      toast.success(`${docType} ${totals.invoice_number} saved successfully!`);
      fetchSavedInvoices();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const totals = calculateTotals();
    printInvoiceDocument({
      invoiceNumber: totals.invoice_number,
      invoiceDate,
      dueDate,
      customerName: customerName?.trim() || "",
      customerPhone: customerPhone?.trim() || undefined,
      customerAddress: customerAddress?.trim() || undefined,
      customerEmail: customerEmail?.trim() || undefined,
      items: validItems,
      currency: selectedCurrency,
      subtotal: totals.subtotal,
      discountPercent,
      discountAmount: totals.discount_amount,
      vatRate: totals.tax_rate,
      vatAmount: totals.tax_amount,
      grandTotal: totals.total_amount,
      amountPaid,
      balance: totals.balance,
      isPaidInFull: totals.isPaidInFull,
      notes: notes || undefined,
    });
  };

  const handleDownload = () => {
    const totals = calculateTotals();
    exportInvoiceToPdf({
      invoiceNumber: totals.invoice_number,
      invoiceDate,
      dueDate,
      customerName: customerName?.trim() || "",
      customerPhone: customerPhone?.trim() || undefined,
      customerAddress: customerAddress?.trim() || undefined,
      customerEmail: customerEmail?.trim() || undefined,
      items: validItems,
      currency: selectedCurrency,
      subtotal: totals.subtotal,
      discountPercent,
      discountAmount: totals.discount_amount,
      vatRate: totals.tax_rate,
      vatAmount: totals.tax_amount,
      grandTotal: totals.total_amount,
      amountPaid,
      balance: totals.balance,
      isPaidInFull: totals.isPaidInFull,
      notes: notes || undefined,
    });
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
      const { data: itemsData, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;

      const itemsList = (itemsData || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        amount: Number(item.amount)
      }));

      const grandTotal = Number(invoice.total_amount || 0);

      printInvoiceDocument({
        invoiceNumber: invoice.invoice_number || `INV-${invoice.id}`,
        invoiceDate: invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        customerName: invoice.customer_name?.trim() || '',
        customerPhone: invoice.customer_phone?.trim() || undefined,
        customerAddress: invoice.customer_address?.trim() || undefined,
        items: itemsList,
        currency: selectedCurrency,
        subtotal: Number(invoice.subtotal || grandTotal),
        vatRate: Number(invoice.tax_rate || 0),
        vatAmount: Number(invoice.tax_amount || 0),
        grandTotal,
        amountPaid: 0,
        balance: grandTotal,
        isPaidInFull: false,
        notes: invoice.notes || undefined
      });
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
