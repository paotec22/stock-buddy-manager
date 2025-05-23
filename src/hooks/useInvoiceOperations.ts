
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];
type NewInvoiceItem = Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at' | 'invoice_id' | 'item_id'>;

export const useInvoiceOperations = (
  customerName: string,
  customerPhone: string,
  items: NewInvoiceItem[],
  userId: string | undefined
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const validItems = items.filter(item => 
    item.description && item.quantity > 0
  );

  const calculateTotals = () => {
    const subtotal = validItems.reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      subtotal,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: subtotal,
      total: subtotal,
      invoice_number: `INV-${Date.now()}`
    };
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be logged in to create invoices");
      return;
    }

    if (validItems.length === 0) {
      toast.error("Please add at least one complete item to the invoice");
      return;
    }

    setIsSubmitting(true);
    try {
      const totals = calculateTotals();
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ 
          customer_name: customerName, 
          customer_phone: customerPhone,
          user_id: userId,
          invoice_number: totals.invoice_number,
          subtotal: totals.subtotal,
          tax_rate: totals.tax_rate,
          tax_amount: totals.tax_amount,
          total_amount: totals.total_amount
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = validItems.map(item => ({
        ...item,
        invoice_id: invoice.id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success("Invoice created successfully!");
      navigate("/sales");
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log("Downloading invoice...");
    toast.info("PDF download feature coming soon!");
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

  const handlePrintSavedInvoice = (invoice: Invoice) => {
    setIsModalOpen(false);

    const printContents = `
      <div>
        <h1>Invoice #: ${invoice.invoice_number}</h1>
        <p>Customer Name: ${invoice.customer_name}</p>
        <p>Customer Phone: ${invoice.customer_phone}</p>
        <p>Total Amount: ${invoice.total_amount}</p>
        <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
      </div>
    `;
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(printContents);
      newWindow.document.close();
      newWindow.print();
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
    handlePrintSavedInvoice
  };
};
