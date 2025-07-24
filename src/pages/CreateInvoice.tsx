
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar/SidebarContext";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { BankDetails } from "@/components/invoice/BankDetails";
import { SavedInvoicesModal } from "@/components/invoice/SavedInvoicesModal";
import { InvoiceFooter } from "@/components/invoice/InvoiceFooter";
import { CurrencyChanger, currencies, type Currency } from "@/components/invoice/CurrencyChanger";
import { useAuth } from "@/components/AuthProvider";
import { useInvoiceOperations } from "@/hooks/useInvoiceOperations";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type NewInvoiceItem = Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at' | 'invoice_id' | 'item_id'>;

const CreateInvoice = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<NewInvoiceItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to NGN
  const [amountPaid, setAmountPaid] = useState(0);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const {
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
  } = useInvoiceOperations(customerName, customerPhone, items, session?.user.id);

  useEffect(() => {
    if (!loading && !session) {
      console.log("No session found, redirecting to login");
      toast.error("Please log in to create invoices");
      navigate("/");
    }
  }, [session, loading, navigate]);

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
          
          <div className="flex justify-end mb-6">
            <CurrencyChanger
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>
          
          <InvoiceItemsTable
            items={validItems}
            setItems={setItems}
            totals={calculateTotals()}
            currency={selectedCurrency}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
          />
          
          <BankDetails />
        </div>

        <SavedInvoicesModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          invoices={savedInvoices}
          onPrintInvoice={handlePrintSavedInvoice}
        />

        <InvoiceFooter />
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;
