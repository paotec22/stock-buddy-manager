
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar/SidebarContext";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { BankDetails } from "@/components/invoice/BankDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database['public']['Tables']['invoices']['Row'];
type NewInvoiceItem = Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at' | 'invoice_id' | 'item_id'>;

const CreateInvoice = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<NewInvoiceItem[]>([]);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      console.log("No session found, redirecting to login");
      toast.error("Please log in to create invoices");
      navigate("/");
    }
  }, [session, loading, navigate]);

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
    if (!session?.user.id) {
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

  if (loading) {
    return null;
  }

  if (!session) {
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
            onShowSavedInvoices={handleShowSavedInvoices}
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

        {/* Modal for displaying saved invoices */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Saved Invoice to Print</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {savedInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <span>
                    {new Date(invoice.created_at).toLocaleDateString()} - {invoice.invoice_number}
                  </span>
                  <Button onClick={() => handlePrintSavedInvoice(invoice)}>Print</Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <footer className="bg-[#081def] text-white h-[2cm] flex items-center justify-between px-8 text-sm md:text-base print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-[#081def] print:text-white">
          <div>
            <p>Phone: 07035339641, 08131927116</p>
          </div>
          <div className="max-w-2xl text-right">
            <p>Address: 41, Olowu Street, Ikeja, Lagos</p>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;
