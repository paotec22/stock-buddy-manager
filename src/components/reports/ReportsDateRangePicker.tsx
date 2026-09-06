import { useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReportsDateRangePickerProps {
  dateFrom?: Date;
  dateTo?: Date;
  onDateRangeChange: (from?: Date, to?: Date) => void;
  className?: string;
}

export function ReportsDateRangePicker({
  dateFrom,
  dateTo,
  onDateRangeChange,
  className,
}: ReportsDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const dateRange: DateRange | undefined = dateFrom || dateTo ? {
    from: dateFrom,
    to: dateTo
  } : undefined;

  const handleSelectRange = (range: DateRange | undefined) => {
    if (!range) {
      onDateRangeChange(undefined, undefined);
    } else {
      onDateRangeChange(range.from, range.to);
    }
  };

  const applyPreset = (preset: 'today' | 'last7' | 'thisMonth' | 'thisYear' | 'all') => {
    const now = new Date();
    switch (preset) {
      case 'today':
        onDateRangeChange(startOfDay(now), endOfDay(now));
        break;
      case 'last7':
        onDateRangeChange(startOfDay(subDays(now, 6)), endOfDay(now));
        break;
      case 'thisMonth':
        onDateRangeChange(startOfMonth(now), endOfMonth(now));
        break;
      case 'thisYear':
        onDateRangeChange(startOfYear(now), endOfYear(now));
        break;
      case 'all':
        onDateRangeChange(undefined, undefined);
        break;
    }
    setOpen(false);
  };

  const formatDateLabel = () => {
    if (!dateFrom && !dateTo) return "All Time";
    if (dateFrom && !dateTo) return `From ${format(dateFrom, "MMM dd, yyyy")}`;
    if (dateFrom && dateTo) {
      if (format(dateFrom, "yyyy-MM-dd") === format(dateTo, "yyyy-MM-dd")) {
        return format(dateFrom, "MMM dd, yyyy");
      }
      return `${format(dateFrom, "MMM dd")} - ${format(dateTo, "MMM dd, yyyy")}`;
    }
    return "Select date";
  };

  const hasFilter = Boolean(dateFrom || dateTo);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-start text-left font-normal text-xs sm:text-sm bg-background border-input hover:bg-muted px-2.5 sm:px-3",
              !hasFilter ? "text-muted-foreground" : "text-foreground font-medium border-primary/40 bg-primary/5"
            )}
          >
            <CalendarIcon className={cn("mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", hasFilter ? "text-primary" : "text-muted-foreground")} />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{formatDateLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 max-w-[calc(100vw-1.5rem)] overflow-hidden"
          align={isMobile ? "center" : "end"}
        >
          <div className="p-2 sm:p-2.5 border-b border-border flex flex-wrap gap-1 bg-muted/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs px-2"
              onClick={() => applyPreset('today')}
            >
              Today
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs px-2"
              onClick={() => applyPreset('last7')}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs px-2"
              onClick={() => applyPreset('thisMonth')}
            >
              This Month
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs px-2"
              onClick={() => applyPreset('thisYear')}
            >
              This Year
            </Button>
            {hasFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 ml-auto"
                onClick={() => applyPreset('all')}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="p-1 sm:p-2 flex justify-center">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateFrom || new Date()}
              selected={dateRange}
              onSelect={handleSelectRange}
              numberOfMonths={isMobile ? 1 : 2}
              className="pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateRangeChange(undefined, undefined)}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
          title="Reset date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
