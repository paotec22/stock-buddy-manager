import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { BankDetails } from "@/components/invoice/BankDetails";

const CreateInvoice = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = 0.075; // 7.5%
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total,
      taxRate: taxRate * 100
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ 
          customer_name: customerName, 
          customer_phone: customerPhone,
          ...calculateTotals()
        })
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success("Invoice created successfully");
      navigate("/invoices");
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    console.log("Printing invoice...");
    window.print();
  };

  const handleDownload = () => {
    console.log("Downloading invoice...");
    // For now, we'll just show a toast since PDF generation will be implemented later
    toast.info("PDF download feature coming soon!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col md:flex-row w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-full md:max-w-4xl mx-auto">
            <InvoiceHeader
              onPrint={handlePrint}
              onDownload={handleDownload}
              isSubmitting={isSubmitting}
              onSave={handleSubmit}
            />

            <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">INVOICE</h1>

            <CustomerInfo
              customerName={customerName}
              customerPhone={customerPhone}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
            />

            <InvoiceItemsTable
              items={items}
              setItems={setItems}
              totals={calculateTotals()}
            />

            <BankDetails />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;