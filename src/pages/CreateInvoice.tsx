import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { CustomerInfo } from "@/components/invoice/CustomerInfo";
import { BankDetails } from "@/components/invoice/BankDetails";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import 'jspdf-autotable';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceDate] = useState<Date>(new Date());
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    return { subtotal, total: subtotal };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const { total } = calculateTotals();

    // Add company logo
    doc.addImage("/Puido_Smart_Solutions.svg", "SVG", 20, 10, 80, 30);
    
    // Add INVOICE text
    doc.setFontSize(24);
    doc.text("INVOICE", 105, 50, { align: "center" });
    
    // Add customer information
    doc.setFontSize(12);
    doc.text(`Invoice to: ${customerName}`, 20, 70);
    doc.text(`Phone: ${customerPhone}`, 20, 80);

    // Add invoice date and number
    doc.text(`Date: ${format(invoiceDate, "dd/MM/yyyy")}`, 150, 70);
    doc.text(`Invoice#: ${new Date().getTime()}`, 150, 80);

    // Add items table
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `₦${item.unit_price.toLocaleString()}`,
      `₦${item.amount.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [["Description", "Quantity", "Unit Price", "Total"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total: ₦${total.toLocaleString()}`, 150, finalY);

    // Add bank details
    doc.setFontSize(11);
    doc.text("PAYMENT METHOD", 20, finalY + 30);
    doc.text("Bank Name: Globus Bank", 20, finalY + 40);
    doc.text("Acc Number: 1000145362", 20, finalY + 50);
    doc.text("Acc. Name: Puido Smart Solution Ltd.", 20, finalY + 60);

    // Add thank you message
    doc.text("Thanks for your Patronage", 20, finalY + 80);

    // Save the PDF
    doc.save(`invoice-${new Date().getTime()}.pdf`);
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to create an invoice");
      return;
    }

    if (!customerName) {
      toast.error("Please enter customer name");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      const { subtotal, total } = calculateTotals();
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          invoice_date: invoiceDate.toISOString(),
          subtotal,
          total_amount: total,
          user_id: session.user.id
        })
        .select()
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <InvoiceHeader
              onPrint={handlePrint}
              onDownload={handleDownload}
              isSubmitting={isSubmitting}
              onSave={handleSubmit}
            />

            <h1 className="text-3xl font-bold text-center mb-8">INVOICE</h1>

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