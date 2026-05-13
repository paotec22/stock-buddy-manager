import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InventoryExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (range: { from?: Date; to?: Date }) => Promise<void> | void;
}

export function InventoryExportModal({ open, onOpenChange, onExport }: InventoryExportModalProps) {
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({ from, to });
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  const DateField = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value?: Date;
    onChange: (d?: Date) => void;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)} className="h-7 text-xs text-muted-foreground">
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Inventory Report</DialogTitle>
          <DialogDescription>
            Choose a period. Quantities will reflect each item's stock as of the "To" date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <DateField label="From (optional)" value={from} onChange={setFrom} placeholder="Earliest date" />
          <DateField label="To" value={to} onChange={setTo} placeholder="As of date" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !to}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
