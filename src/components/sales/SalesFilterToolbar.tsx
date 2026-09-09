import { Search, RotateCcw, Calendar as CalendarIcon, MapPin, CreditCard, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  isVisible?: boolean;
  onToggleVisibility?: () => void;
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
  isVisible: controlledVisible,
  onToggleVisibility: controlledToggle,
}: SalesFilterToolbarProps) {
  const [internalVisible, setInternalVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem("sales_filter_visible");
    return saved !== null ? saved === "true" : false; // Hidden by default
  });

  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  const toggleVisibility = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      setInternalVisible((prev) => {
        const next = !prev;
        localStorage.setItem("sales_filter_visible", String(next));
        return next;
      });
    }
  };

  const [calendarOpen, setCalendarOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const formatDateLabel = () => {
    if (!dateRange?.from) return "All Dates";
    if (!dateRange.to) {
      return format(dateRange.from, "MMM d, yyyy");
    }
    if (isMobile) {
      return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`;
    }
    return `${format(dateRange.from, "LLL dd, y")} – ${format(dateRange.to, "LLL dd, y")}`;
  };

  // When filters are hidden, display a sleek collapsed bar
  if (!isVisible) {
    return (
      <div className="rounded-xl border border-border/80 bg-card px-3.5 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-200">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={toggleVisibility}
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors cursor-pointer py-1"
            title="Click to show filter options"
          >
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">Filters</span>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-normal">Hidden</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </button>

          {hasActiveFilters ? (
            <div className="flex items-center gap-1.5 flex-wrap ml-1 text-xs">
              <span className="text-muted-foreground font-medium text-[11px]">• Active:</span>
              {searchTerm.trim() && (
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-[11px] font-medium truncate max-w-[140px]">
                  "{searchTerm}"
                </span>
              )}
              {selectedLocation !== "all" && (
                <span className="bg-muted text-foreground px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {selectedLocation}
                </span>
              )}
              {paymentStatus !== "all" && (
                <span className="bg-muted text-foreground px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  {paymentStatus === "paid" ? "Paid" : paymentStatus === "part_paid" ? "Part Paid" : "Unpaid"}
                </span>
              )}
              {dateRange?.from && (
                <span className="bg-muted text-foreground px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {formatDateLabel()}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-[11px] hidden md:inline">
              All transactions displayed. Click to filter by branch, date, status, or search.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] text-destructive hover:underline font-medium cursor-pointer flex items-center gap-1 px-1.5 py-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 px-2.5 cursor-pointer font-medium"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Show Filters</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2.5 sm:p-4 shadow-sm space-y-2 sm:space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Filter Transactions</span>
          {hasActiveFilters && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVisibility}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            title="Hide filter bar"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Hide Filters</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, notes..."
            className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background border-border w-full"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Location & Payment selectors: 2-column grid on mobile, inline on md+ */}
        <div className="grid grid-cols-2 md:flex md:w-auto gap-2">
          {/* Location selector */}
          <div className="w-full md:w-[160px]">
            <Select value={selectedLocation} onValueChange={onLocationChange}>
              <SelectTrigger className="h-9 text-xs sm:text-sm bg-background w-full">
                <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
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
          <div className="w-full md:w-[150px]">
            <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
              <SelectTrigger className="h-9 text-xs sm:text-sm bg-background w-full">
                <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid in Full</SelectItem>
                <SelectItem value="part_paid">Part Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid / Debt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date range picker & Reset on mobile */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Date range picker */}
          <div className="flex-1 md:w-auto">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 w-full md:w-auto md:min-w-[200px] justify-start text-left font-normal text-xs sm:text-sm bg-background px-2.5 sm:px-3",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{formatDateLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 max-w-[calc(100vw-1.5rem)] overflow-hidden" 
                align={isMobile ? "center" : "end"}
              >
                <div className="p-2 sm:p-3 border-b border-border flex flex-wrap gap-1 sm:gap-1.5 bg-muted/30">
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
                    7 Days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => applyPreset("month")}
                  >
                    Month
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => applyPreset("year")}
                  >
                    Year
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
                  numberOfMonths={isMobile ? 1 : 2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reset button if filters are active */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 border-border bg-background"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
