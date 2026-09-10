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
    <Card className="mt-3 border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 print:shadow-none print:border print:border-blue-300 print:rounded-lg print:bg-blue-50/30 print:break-inside-avoid print:mt-1">
      <CardContent className="p-3 sm:p-3.5 print:p-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#081def]" />
            <h4 className="font-bold text-xs tracking-wider uppercase" style={{ color: "#081def" }}>
              Official Payment Instructions
            </h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="!min-h-0 h-8 sm:h-6 text-xs border-blue-300 dark:border-blue-800 text-[#081def] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 print:hidden self-start sm:self-auto px-2.5 active:scale-95 transition-transform"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            <span>{copied ? "Copied to Clipboard" : "Copy Account Details"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2 mt-2.5 sm:mt-2 text-xs font-medium" style={{ color: "#081def" }}>
          <div className="bg-background/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
            <span className="text-[10px] opacity-75 uppercase block font-semibold">Bank Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.bankName}</span>
          </div>
          <div className="bg-background/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
            <span className="text-[10px] opacity-75 uppercase block font-semibold">Account Number</span>
            <span className="font-bold font-mono text-foreground text-xs sm:text-sm tracking-wider">{bankInfo.accountNumber}</span>
          </div>
          <div className="bg-background/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
            <span className="text-[10px] opacity-75 uppercase block font-semibold">Account Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.accountName}</span>
          </div>
        </div>

        <div className="mt-2 pt-1.5 text-xs font-semibold border-t border-blue-200/40 dark:border-blue-900/30 flex items-center justify-between" style={{ color: "#081def" }}>
          <span className="text-xs">Thank you for your patronage!</span>
          <span className="text-[10px] font-normal text-muted-foreground hidden sm:inline">Please specify Invoice # in bank reference</span>
        </div>
      </CardContent>
    </Card>
  );
};
