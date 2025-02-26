
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

  // Filter out incomplete items before calculation
  const validItems = items.filter(item => 
    item.description && item.quantity > 0 && item.unit_price > 0
  );

  const calculateTotals = () => {
    // Sum up the exact amount from each item (no tax)
    const subtotal = validItems.reduce((sum, item) => sum + Number(item.amount), 0);
    
    console.log("Calculating totals:", {
      items: validItems,
      subtotal: subtotal,
      totalAmount: subtotal
    });

    return {
      subtotal,
      tax_rate: 0, // Set tax rate to 0
      tax_amount: 0, // No tax amount
      total_amount: subtotal, // Total is just the subtotal with no tax
      total: subtotal, // This matches the InvoiceItemsTable prop requirement
      invoice_number: `INV-${Date.now()}`
    };
  };

  const handleSubmit = async () => {
    if (!session?.user.id) {
      toast.error("You must be logged in to create invoices");
      return;
    }

    // Validate we have at least one valid item before submission
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
          user_id: session.user.id,
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

  // Show loading state
  if (loading) {
    console.log("Loading authentication state...");
    return null;
  }

  // Redirect if not authenticated
  if (!session) {
    console.log("No active session found");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="container mx-auto p-6 space-y-8 min-h-screen">
        <div className="pb-20">
          <InvoiceHeader 
            onPrint={handlePrint} 
            onDownload={handleDownload} 
            isSubmitting={isSubmitting}
            onSave={handleSubmit}
          />
          
          <CustomerInfo
            customerName={customerName}
            onNameChange={setCustomerName}
            customerPhone={customerPhone}
            onPhoneChange={setCustomerPhone}
          />
          
          <InvoiceItemsTable
            items={validItems}
            setItems={setItems}
            totals={calculateTotals()}
          />
          
          <BankDetails />
        </div>

        <footer className="bg-[#081def] text-white h-[2cm] flex items-center justify-between px-8 text-sm md:text-base print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-[#081def] print:text-white">
          <div>
            <p>Phone: 07035339641, 08131927116</p>
          </div>
          <div className="max-w-2xl text-right">
            <p>Address: 26, Folashade Tinubu Ojo, KLM19 Agege Motor Road Air Market, Ikeja-Along, Lagos</p>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;
