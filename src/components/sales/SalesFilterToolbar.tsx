import { Search, RotateCcw, Calendar as CalendarIcon, MapPin, CreditCard, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SalesFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  locations: string[];
  paymentStatus: string;
  onPaymentStatusChange: (status: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function SalesFilterToolbar({
  searchTerm,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  locations,
  paymentStatus,
  onPaymentStatusChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
  hasActiveFilters,
}: SalesFilterToolbarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const applyPreset = (preset: "today" | "week" | "month" | "year") => {
    const now = new Date();
    if (preset === "today") {
      onDateRangeChange({ from: startOfDay(now), to: endOfDay(now) });
    } else if (preset === "week") {
      onDateRangeChange({ from: subDays(now, 7), to: endOfDay(now) });
    } else if (preset === "month") {
      onDateRangeChange({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (preset === "year") {
      onDateRangeChange({ from: startOfYear(now), to: endOfYear(now) });
    }
    setCalendarOpen(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, notes..."
            className="pl-9 pr-8 h-9 text-sm bg-background border-border"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Location selector */}
        <div className="w-full md:w-[170px]">
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="h-9 text-sm bg-background">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment status filter */}
        <div className="w-full md:w-[160px]">
          <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
            <SelectTrigger className="h-9 text-sm bg-background">
              <CreditCard className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid in Full</SelectItem>
              <SelectItem value="part_paid">Part Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid / Debt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date range picker */}
        <div className="w-full md:w-auto">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-full md:w-auto min-w-[210px] justify-start text-left font-normal text-sm bg-background",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span>
                      {format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}
                    </span>
                  ) : (
                    <span>{format(dateRange.from, "LLL dd, y")}</span>
                  )
                ) : (
                  <span>All Dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b border-border flex flex-wrap gap-1.5 bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPreset("today")}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPreset("week")}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPreset("month")}
                >
                  This Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPreset("year")}
                >
                  This Year
                </Button>
                {dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-muted-foreground ml-auto"
                    onClick={() => {
                      onDateRangeChange(undefined);
                      setCalendarOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from || new Date()}
                selected={dateRange}
                onSelect={(range) => {
                  onDateRangeChange(range);
                  if (range?.from && range?.to) {
                    setCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Reset button if filters are active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
            title="Reset all filters"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
