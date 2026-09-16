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
    <Card className="h-full border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 shadow-xs print:shadow-none print:border print:border-blue-300 print:rounded-lg print:bg-blue-50/30 print:break-inside-avoid flex flex-col justify-between">
      <CardContent className="p-4 sm:p-5 print:p-3 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-blue-200/70 dark:border-blue-900/40">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#081def]" />
            <h4 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-[#081def]">
              Official Payment Instructions
            </h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="!min-h-0 h-8 sm:h-7 text-xs border-blue-300 dark:border-blue-800 text-[#081def] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 print:hidden self-start sm:self-auto px-3 active:scale-95 transition-transform font-semibold"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            <span>{copied ? "Copied" : "Copy Account Details"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium">
          <div className="bg-background/80 dark:bg-card/60 sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none border border-blue-100 dark:border-blue-900/30 sm:border-none">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Bank Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.bankName}</span>
          </div>
          <div className="bg-background/80 dark:bg-card/60 sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none border border-blue-100 dark:border-blue-900/30 sm:border-none">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Account Number</span>
            <span className="font-bold font-mono text-foreground text-xs sm:text-sm tracking-wider">{bankInfo.accountNumber}</span>
          </div>
          <div className="bg-background/80 dark:bg-card/60 sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none border border-blue-100 dark:border-blue-900/30 sm:border-none">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Account Name</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">{bankInfo.accountName}</span>
          </div>
        </div>

        <div className="pt-2 text-xs border-t border-blue-200/50 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#081def]">
          <span className="font-medium">Thank you for your patronage!</span>
          <span className="text-[11px] font-normal text-muted-foreground">Please specify Invoice # in bank transfer narration</span>
        </div>
      </CardContent>
    </Card>
  );
};
