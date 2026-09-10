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
import { Button } from "@/components/ui/button";
import { Save, Printer } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

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
    handleLoadInvoiceData,
    amountPaid,
    selectedCurrency
  );

  const totals = calculateTotals();
  const isPaidInFull = totals.isPaidInFull;

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
    <div className="max-w-6xl mx-auto px-2.5 sm:px-4 md:px-6 print:px-0 space-y-3 sm:space-y-3.5 pb-16 sm:pb-10 print:space-y-2 print:pb-0 invoice-print-container">
      {/* Top Invoice Main Content */}
      <div className="space-y-3 sm:space-y-3.5 print:space-y-2 print:flex-1">
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
          isPaidInFull={isPaidInFull}
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
        <div className="flex flex-row items-center justify-between gap-2 bg-card px-3 py-2 sm:py-2.5 rounded-xl border border-border/80 shadow-xs print:hidden">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pricing Currency
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
        />
      </div>

      {/* Bottom Section: Official Payment Instructions & Printable Footer */}
      <div className="invoice-print-bottom print:mt-auto print:pt-4 space-y-3 print:space-y-2">
        {/* Bank Payment Instructions (Official Payment Instructions) */}
        <BankDetails />

        {/* Printable Footer */}
        <InvoiceFooter />
      </div>

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

      {/* Mobile Quick-Action Floating Dock */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 px-3 py-2.5 shadow-lg print:hidden">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              {isPaidInFull ? "Paid Total" : "Grand Total"}
            </span>
            <span className="font-mono font-bold text-sm text-foreground">
              {formatCurrency(calculateTotals().grandTotal, selectedCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="!min-h-0 h-9 px-2.5 text-xs active:scale-95 bg-background"
              title="Print"
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className={`!min-h-0 h-9 px-3 text-xs font-semibold text-primary-foreground shadow-xs active:scale-95 transition-transform ${
                isPaidInFull
                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              <span>{isSubmitting ? "Saving..." : isPaidInFull ? "Save Receipt" : "Save Invoice"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
