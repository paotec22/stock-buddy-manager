import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceItemsTable } from "@/components/invoice/InvoiceItemsTable";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 7.5; // 7.5% tax rate
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const { subtotal, taxAmount, total } = calculateTotals();

    // Add company header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    // Add customer information
    doc.setFontSize(12);
    doc.text("Bill To:", 20, 40);
    doc.text(customerName, 20, 50);
    doc.text(customerAddress, 20, 60);
    doc.text(`Phone: ${customerPhone}`, 20, 70);

    // Add invoice details
    doc.text(`Invoice Date: ${format(invoiceDate, "PPP")}`, 120, 40);
    doc.text(`Due Date: ${format(dueDate, "PPP")}`, 120, 50);

    // Add items table
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [["Description", "Quantity", "Unit Price", "Amount"]],
      body: tableData,
    });

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`Tax (7.5%): $${taxAmount.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 20);

    // Add notes if any
    if (notes) {
      doc.text("Notes:", 20, finalY + 40);
      doc.text(notes, 20, finalY + 50);
    }

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
      const { subtotal, taxAmount, total } = calculateTotals();
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: customerName,
          customer_address: customerAddress,
          customer_phone: customerPhone,
          invoice_date: invoiceDate.toISOString(),
          due_date: dueDate.toISOString(),
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          notes,
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
              <h1 className="text-2xl font-bold">Create Invoice</h1>
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
                  <div className="md:col-span-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Invoice Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !invoiceDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceDate}
                          onSelect={(date) => date && setInvoiceDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => date && setDueDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  placeholder="Any additional notes..."
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateInvoice;