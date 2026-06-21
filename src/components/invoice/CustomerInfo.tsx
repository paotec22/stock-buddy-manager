
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSelector, type CustomerLite } from "@/components/customers/CustomerSelector";

interface CustomerInfoProps {
  customerName: string;
  customerPhone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  selectedCustomerId?: string | null;
  onCustomerSelect?: (customer: CustomerLite | null) => void;
}

export const CustomerInfo = ({
  customerName,
  customerPhone,
  onNameChange,
  onPhoneChange,
  selectedCustomerId,
  onCustomerSelect,
}: CustomerInfoProps) => {
  const handleSelect = (c: CustomerLite | null) => {
    onCustomerSelect?.(c);
    if (c) {
      onNameChange(c.name);
      onPhoneChange(c.phone ?? "");
    }
  };

  return (
    <Card className="mb-6 print:shadow-none">
      <CardContent className="p-6 space-y-4">
        {onCustomerSelect && (
          <div className="print:hidden">
            <Label className="mb-1.5 block">Select existing customer (optional)</Label>
            <CustomerSelector value={selectedCustomerId ?? null} onChange={handleSelect} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="customerName">Invoice to:</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
