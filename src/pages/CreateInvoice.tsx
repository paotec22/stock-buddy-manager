import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar/SidebarContext";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { BankDetails } from "@/components/invoice/BankDetails";
import { useAuth } from "@/components/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];
type NewInvoiceItem = Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at' | 'invoice_id' | 'item_id'>;

const CreateInvoice = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<NewInvoiceItem[]>([]);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      console.log("No session found, redirecting to login");
      toast.error("Please log in to create invoices");
      navigate("/");
    }
  }, [session, loading, navigate]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = 7.5; // 7.5% tax rate
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      invoice_number: `INV-${Date.now()}`, // Simple invoice number generation
    };
  };

  const handleSubmit = async () => {
    if (!session?.user.id) {
      toast.error("You must be logged in to create invoices");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ 
          customer_name: customerName, 
          customer_phone: customerPhone,
          user_id: session.user.id,
          ...calculateTotals()
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = items.map(item => ({
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

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Show nothing if not authenticated
  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="container mx-auto p-6 space-y-8">
        <InvoiceHeader onPrint={handlePrint} onDownload={handleDownload} />
        
        <CustomerInfo
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
        />
        
        <InvoiceItemsTable
          items={items}
          setItems={setItems}
        />
        
        <BankDetails />
        
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;