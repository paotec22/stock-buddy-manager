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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type InventoryExportMode = "snapshot" | "added";

interface InventoryExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (range: { from?: Date; to?: Date; mode: InventoryExportMode }) => Promise<void> | void;
}

export function InventoryExportModal({ open, onOpenChange, onExport }: InventoryExportModalProps) {
  const [mode, setMode] = useState<InventoryExportMode>("snapshot");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({ from, to, mode });
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

  const requireFrom = mode === "added";
  const canExport = !!to && (!requireFrom || !!from);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Inventory Report</DialogTitle>
          <DialogDescription>
            Choose what to export and the time period.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Export type</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as InventoryExportMode)} className="gap-2">
              <div className="flex items-start space-x-2 rounded-md border p-3">
                <RadioGroupItem value="snapshot" id="mode-snapshot" className="mt-1" />
                <Label htmlFor="mode-snapshot" className="font-normal cursor-pointer">
                  <div className="font-medium">Inventory status (snapshot)</div>
                  <div className="text-xs text-muted-foreground">
                    Exact stock each item had as of the "To" date.
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 rounded-md border p-3">
                <RadioGroupItem value="added" id="mode-added" className="mt-1" />
                <Label htmlFor="mode-added" className="font-normal cursor-pointer">
                  <div className="font-medium">Inventory added in period</div>
                  <div className="text-xs text-muted-foreground">
                    Only items added between From and To, with quantities added.
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DateField
            label={mode === "added" ? "From" : "From (optional)"}
            value={from}
            onChange={setFrom}
            placeholder="Start date"
          />
          <DateField label="To" value={to} onChange={setTo} placeholder="End date" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !canExport}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
