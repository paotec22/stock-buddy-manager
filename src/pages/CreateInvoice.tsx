import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { format } from "date-fns";
import { Printer, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
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
    const { subtotal, total } = calculateTotals();

    // Add company logo
    doc.addImage("/puido-logo.png", "PNG", 20, 10, 80, 30);
    
    // Add INVOICE text
    doc.setFontSize(24);
    doc.text("INVOICE", 105, 50, { align: "center" });
    
    // Add customer information
    doc.setFontSize(12);
    doc.text("Bill To:", 20, 70);
    doc.text(customerName, 20, 80);
    doc.text(`Phone: ${customerPhone}`, 20, 90);

    // Add invoice date
    doc.text(`Invoice Date: ${format(invoiceDate, "PPP")}`, 120, 70);

    // Add items table
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `₦${item.unit_price.toFixed(2)}`,
      `₦${item.amount.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [["Description", "Quantity", "Unit Price", "Amount"]],
      body: tableData,
    });

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total: ₦${total.toFixed(2)}`, 140, finalY + 10);

    // Add bank details
    doc.setFontSize(11);
    doc.text("Bank Details:", 20, finalY + 30);
    doc.text("Bank Name: Globus Bank", 20, finalY + 40);
    doc.text("Acc Number: 1000145362", 20, finalY + 50);
    doc.text("Acc. Name: Puido Smart Solution Ltd.", 20, finalY + 60);

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
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <img src="/puido-logo.png" alt="Puido Smart Solutions" className="h-16" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} disabled={isSubmitting}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={isSubmitting}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  Save Invoice
                </Button>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-8">INVOICE</h1>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <InvoiceItemsTable
              items={items}
              setItems={setItems}
              totals={calculateTotals()}
            />

            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Bank Details:</p>
                  <p>Bank Name: Globus Bank</p>
                  <p>Acc Number: 1000145362</p>
                  <p>Acc. Name: Puido Smart Solution Ltd.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;