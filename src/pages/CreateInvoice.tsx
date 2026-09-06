import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";

import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { BankDetails } from "@/components/invoice/BankDetails";
import { SavedInvoicesModal } from "@/components/invoice/SavedInvoicesModal";
import { InvoiceFooter } from "@/components/invoice/InvoiceFooter";
import { CurrencyChanger, currencies, type Currency } from "@/components/invoice/CurrencyChanger";
import { useAuth } from "@/components/AuthProvider";
import { useInvoiceOperations, type NewInvoiceItem } from "@/hooks/useInvoiceOperations";
import { toast } from "sonner";

const CreateInvoice = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${format(new Date(), "yyyyMMddHHmmss")}`);
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 14));
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<NewInvoiceItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to NGN
  const [amountPaid, setAmountPaid] = useState(0);
  const [includeVat, setIncludeVat] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const handleLoadInvoiceData = (data: {
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
  }) => {
    setCustomerName(data.customerName);
    setCustomerPhone(data.customerPhone);
    setCustomerAddress(data.customerAddress);
    setCustomerEmail(data.customerEmail);
    setInvoiceNumber(data.invoiceNumber);
    setInvoiceDate(data.invoiceDate);
    setDueDate(data.dueDate);
    setNotes(data.notes);
    setItems(data.items);
    setIncludeVat(data.includeVat);
    setDiscountPercent(data.discountPercent);
    setSelectedCustomerId(data.selectedCustomerId);
  };

  const handleResetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerEmail("");
    setSelectedCustomerId(null);
    setInvoiceNumber(`INV-${format(new Date(), "yyyyMMddHHmmss")}`);
    setInvoiceDate(new Date());
    setDueDate(addDays(new Date(), 14));
    setNotes("");
    setItems([]);
    setAmountPaid(0);
    setIncludeVat(false);
    setDiscountPercent(0);
    toast.info("Invoice form reset");
  };

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
    handlePrintSavedInvoice,
    handleLoadInvoice,
    handleDeleteSavedInvoice,
    loadingInvoiceId
  } = useInvoiceOperations(
    customerName,
    customerPhone,
    customerAddress,
    customerEmail,
    invoiceNumber,
    invoiceDate,
    dueDate,
    notes,
    items,
    session?.user.id,
    includeVat,
    discountPercent,
    selectedCustomerId,
    handleLoadInvoiceData
  );

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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-12">
      {/* Top Invoice Config Header */}
      <InvoiceHeader 
        onPrint={handlePrint} 
        onDownload={handleDownload} 
        isSubmitting={isSubmitting}
        onSave={handleSubmit}
        onShowSavedInvoices={handleShowSavedInvoices}
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        invoiceDate={invoiceDate}
        onInvoiceDateChange={setInvoiceDate}
        onReset={handleResetForm}
      />

      {/* Customer Information Card */}
      <CustomerInfo
        customerName={customerName}
        onNameChange={setCustomerName}
        customerPhone={customerPhone}
        onPhoneChange={setCustomerPhone}
        customerAddress={customerAddress}
        onAddressChange={setCustomerAddress}
        customerEmail={customerEmail}
        onEmailChange={setCustomerEmail}
        selectedCustomerId={selectedCustomerId}
        onCustomerSelect={(c) => setSelectedCustomerId(c?.id ?? null)}
      />

      {/* Currency Selector Toolbar */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border/80 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Invoice Pricing Currency
        </span>
        <CurrencyChanger
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
      </div>

      {/* Line Items Table & Summary */}
      <InvoiceItemsTable
        items={validItems}
        setItems={setItems}
        totals={calculateTotals()}
        currency={selectedCurrency}
        amountPaid={amountPaid}
        onAmountPaidChange={setAmountPaid}
        includeVat={includeVat}
        onVatChange={setIncludeVat}
        discountPercent={discountPercent}
        onDiscountChange={setDiscountPercent}
        notes={notes}
        onNotesChange={setNotes}
      />

      {/* Bank Payment Instructions */}
      <BankDetails />

      {/* Saved Invoices History Modal */}
      <SavedInvoicesModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        invoices={savedInvoices}
        onPrintInvoice={handlePrintSavedInvoice}
        onLoadInvoice={handleLoadInvoice}
        onDeleteInvoice={handleDeleteSavedInvoice}
        loadingInvoiceId={loadingInvoiceId}
      />

      {/* Printable Footer */}
      <InvoiceFooter />
    </div>
  );
};

export default CreateInvoice;
