import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSelector, type CustomerLite } from "@/components/customers/CustomerSelector";
import { User, Phone, MapPin, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerInfoProps {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerEmail?: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  selectedCustomerId?: string | null;
  onCustomerSelect?: (customer: CustomerLite | null) => void;
}

export const CustomerInfo = ({
  customerName,
  customerPhone,
  customerAddress = "",
  customerEmail = "",
  onNameChange,
  onPhoneChange,
  onAddressChange,
  onEmailChange,
  selectedCustomerId,
  onCustomerSelect,
}: CustomerInfoProps) => {
  const hasName = Boolean(customerName && customerName.trim().length > 0);
  const hasPhone = Boolean(customerPhone && customerPhone.trim().length > 0);
  const hasEmail = Boolean(customerEmail && customerEmail.trim().length > 0);
  const hasAddress = Boolean(customerAddress && customerAddress.trim().length > 0);
  const hasAnyCustomerDetail = hasName || hasPhone || hasEmail || hasAddress;

  const handleSelect = (c: CustomerLite | null) => {
    onCustomerSelect?.(c);
    if (c) {
      onNameChange(c.name);
      onPhoneChange(c.phone ?? "");
      if (onAddressChange && c.address) {
        onAddressChange(c.address);
      }
      if (onEmailChange && c.email) {
        onEmailChange(c.email);
      }
    }
  };

  const handleClear = () => {
    onCustomerSelect?.(null);
    onNameChange("");
    onPhoneChange("");
    if (onAddressChange) onAddressChange("");
    if (onEmailChange) onEmailChange("");
  };

  return (
    <Card className={`border border-border/80 shadow-xs print:shadow-none print:border-none print:rounded-none ${
      !hasAnyCustomerDetail ? "print:hidden" : ""
    }`}>
      <CardContent className="p-3 sm:p-3.5 space-y-2.5 print:p-0 print:space-y-1">
        {onCustomerSelect && (
          <div className="print:hidden space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Existing Customer (Optional)
              </Label>
              {(customerName || customerPhone) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="!min-h-0 h-5 text-[11px] text-muted-foreground hover:text-destructive px-1.5"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Fields
                </Button>
              )}
            </div>
            <CustomerSelector value={selectedCustomerId ?? null} onChange={handleSelect} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Name */}
          <div className={!hasName ? "print:hidden" : ""}>
            <Label htmlFor="customerName" className="text-[11px] font-medium text-muted-foreground mb-0.5 flex items-center gap-1 print:text-[10px] print:uppercase print:font-bold print:text-slate-500">
              <User className="h-3 w-3 text-primary print:hidden" />
              Customer Name <span className="text-destructive print:hidden">*</span>
            </Label>
            <Input
              id="customerName"
              placeholder="e.g. Acme Corp / John Doe"
              value={customerName}
              onChange={(e) => onNameChange(e.target.value)}
              className="!min-h-0 h-9 sm:h-8 text-xs sm:text-sm bg-background print:hidden"
            />
            <div className="hidden print:block font-bold text-xs text-foreground">
              {customerName}
            </div>
          </div>

          {/* Phone */}
          <div className={!hasPhone ? "print:hidden" : ""}>
            <Label htmlFor="customerPhone" className="text-[11px] font-medium text-muted-foreground mb-0.5 flex items-center gap-1 print:text-[10px] print:uppercase print:font-bold print:text-slate-500">
              <Phone className="h-3 w-3 text-primary print:hidden" />
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              placeholder="e.g. 08012345678"
              value={customerPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="!min-h-0 h-9 sm:h-8 text-xs sm:text-sm bg-background font-mono print:hidden"
            />
            <div className="hidden print:block font-mono text-xs text-foreground">
              {customerPhone}
            </div>
          </div>

          {/* Email */}
          <div className={!hasEmail ? "print:hidden" : ""}>
            <Label htmlFor="customerEmail" className="text-[11px] font-medium text-muted-foreground mb-0.5 flex items-center gap-1 print:text-[10px] print:uppercase print:font-bold print:text-slate-500">
              <Mail className="h-3 w-3 text-primary print:hidden" />
              Email Address
            </Label>
            <Input
              id="customerEmail"
              type="email"
              inputMode="email"
              placeholder="e.g. client@example.com"
              value={customerEmail}
              onChange={(e) => onEmailChange?.(e.target.value)}
              className="!min-h-0 h-9 sm:h-8 text-xs sm:text-sm bg-background print:hidden"
            />
            <div className="hidden print:block text-xs text-foreground">
              {customerEmail}
            </div>
          </div>

          {/* Billing Address */}
          <div className={!hasAddress ? "print:hidden" : ""}>
            <Label htmlFor="customerAddress" className="text-[11px] font-medium text-muted-foreground mb-0.5 flex items-center gap-1 print:text-[10px] print:uppercase print:font-bold print:text-slate-500">
              <MapPin className="h-3 w-3 text-primary print:hidden" />
              Billing Address
            </Label>
            <Input
              id="customerAddress"
              placeholder="e.g. 12 Marina St, Victoria Island"
              value={customerAddress}
              onChange={(e) => onAddressChange?.(e.target.value)}
              className="!min-h-0 h-9 sm:h-8 text-xs sm:text-sm bg-background print:hidden"
            />
            <div className="hidden print:block text-xs text-foreground">
              {customerAddress}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
