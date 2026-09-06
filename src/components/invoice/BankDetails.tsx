import { Card, CardContent } from "@/components/ui/card";
import { Building2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const BankDetails = () => {
  const [copied, setCopied] = useState(false);

  const bankInfo = {
    bankName: "Globus Bank",
    accountNumber: "1000145362",
    accountName: "Puido Smart Solution Ltd."
  };

  const handleCopy = () => {
    const text = `Bank: ${bankInfo.bankName}\nAccount No: ${bankInfo.accountNumber}\nAccount Name: ${bankInfo.accountName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Bank details copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mt-6 border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 print:shadow-none print:border-none print:bg-transparent">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#081def]" />
            <h4 className="font-bold text-xs sm:text-sm tracking-wider uppercase" style={{ color: "#081def" }}>
              Official Payment Instructions
            </h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs border-blue-300 dark:border-blue-800 text-[#081def] hover:bg-blue-100 dark:hover:bg-blue-950 print:hidden self-start sm:self-auto"
          >
            {copied ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
            <span>{copied ? "Copied" : "Copy Account Details"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs sm:text-sm font-medium" style={{ color: "#081def" }}>
          <div>
            <span className="text-[11px] opacity-75 uppercase block">Bank Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.bankName}</span>
          </div>
          <div>
            <span className="text-[11px] opacity-75 uppercase block">Account Number</span>
            <span className="font-bold font-mono text-foreground text-xs sm:text-sm tracking-wide">{bankInfo.accountNumber}</span>
          </div>
          <div>
            <span className="text-[11px] opacity-75 uppercase block">Account Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.accountName}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 text-xs font-semibold border-t border-blue-200/40 dark:border-blue-900/30 flex items-center justify-between" style={{ color: "#081def" }}>
          <span>Thank you for your patronage!</span>
          <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">Please specify Invoice # in bank reference</span>
        </div>
      </CardContent>
    </Card>
  );
};
