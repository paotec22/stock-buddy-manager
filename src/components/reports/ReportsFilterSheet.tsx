import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useState } from "react";

interface ReportsFilterSheetProps {
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClearDates: () => void;
}

export function ReportsFilterSheet({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
}: ReportsFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (preset: 'today' | 'last7' | 'thisMonth' | 'thisYear') => {
    const now = new Date();
    setActivePreset(preset);
    switch (preset) {
      case 'today':
        onDateFromChange(startOfDay(now));
        onDateToChange(endOfDay(now));
        break;
      case 'last7':
        onDateFromChange(startOfDay(subDays(now, 6)));
        onDateToChange(endOfDay(now));
        break;
      case 'thisMonth':
        onDateFromChange(startOfMonth(now));
        onDateToChange(endOfMonth(now));
        break;
      case 'thisYear':
        onDateFromChange(startOfYear(now));
        onDateToChange(endOfYear(now));
        break;
    }
    setOpen(false);
  };

  const handleClear = () => {
    setActivePreset(null);
    onClearDates();
    setOpen(false);
  };

  const hasFilter = Boolean(dateFrom || dateTo);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium ${
            hasFilter ? "bg-primary/10 border-primary/40 text-primary" : "bg-background"
          }`}
        >
          <Filter className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          <span>Dates</span>
          {hasFilter && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <SheetHeader className="pb-3 border-b border-border/60">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Filter Reports by Date
          </SheetTitle>
        </SheetHeader>

        {/* Quick Presets */}
        <div className="py-3 border-b border-border/60">
          <label className="text-xs font-medium text-muted-foreground block mb-2">Quick Presets</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activePreset === 'today' ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-center"
              onClick={() => applyPreset('today')}
            >
              Today
            </Button>
            <Button
              variant={activePreset === 'last7' ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-center"
              onClick={() => applyPreset('last7')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={activePreset === 'thisMonth' ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-center"
              onClick={() => applyPreset('thisMonth')}
            >
              This Month
            </Button>
            <Button
              variant={activePreset === 'thisYear' ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-center"
              onClick={() => applyPreset('thisYear')}
            >
              This Year
            </Button>
          </div>
        </div>

        {/* Custom Range Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">From Date</label>
              {dateFrom && (
                <span className="text-xs font-mono font-medium text-primary">
                  {format(dateFrom, "MMM dd, yyyy")}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-border p-2 bg-card">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => {
                  setActivePreset(null);
                  onDateFromChange(d);
                }}
                className="w-full pointer-events-auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">To Date</label>
              {dateTo && (
                <span className="text-xs font-mono font-medium text-primary">
                  {format(dateTo, "MMM dd, yyyy")}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-border p-2 bg-card">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => {
                  setActivePreset(null);
                  onDateToChange(d);
                }}
                className="w-full pointer-events-auto"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center gap-2">
          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1 h-10 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              Reset Filter
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="flex-1 h-10 text-xs font-medium"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
