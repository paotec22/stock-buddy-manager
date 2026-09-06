import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  CalendarIcon,
  RefreshCw,
  Download,
  MapPin,
  Clock,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import type { TimeRangePreset, DateRange } from "@/utils/profitUtils";

interface ProfitFilterToolbarProps {
  preset: TimeRangePreset;
  onPresetChange: (preset: TimeRangePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  locations: string[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCsv: () => void;
}

const PRESET_LABELS: Record<TimeRangePreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  last_30_days: "Last 30 Days",
  this_quarter: "This Quarter",
  this_year: "This Year",
  all_time: "All Time",
  custom: "Custom Date Range",
};

export function ProfitFilterToolbar({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  selectedLocation,
  onLocationChange,
  locations,
  onRefresh,
  isRefreshing,
  onExportCsv,
}: ProfitFilterToolbarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-4 shadow-sm space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Time & Location Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Time Preset Selector */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
            <Select
              value={preset}
              onValueChange={(val) => onPresetChange(val as TimeRangePreset)}
            >
              <SelectTrigger className="h-9 sm:w-[170px] rounded-xl text-xs sm:text-sm font-medium border-border/80 bg-background">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 rounded-xl">
                {Object.entries(PRESET_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs sm:text-sm">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Popover */}
          {preset === "custom" && (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs sm:text-sm font-medium border-border/80 bg-background flex items-center gap-1.5"
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {customRange.from ? (
                    customRange.to ? (
                      <>
                        {format(customRange.from, "MMM d")} -{" "}
                        {format(customRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(customRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Pick dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-background z-50 rounded-2xl" align="start">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground px-1">
                    Select Date Range
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: customRange.from,
                      to: customRange.to,
                    }}
                    onSelect={(range) => {
                      onCustomRangeChange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                    className="rounded-xl border border-border/60"
                  />
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      onClick={() => setDatePickerOpen(false)}
                      className="rounded-xl h-8 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Location Selector */}
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
            <Select value={selectedLocation} onValueChange={onLocationChange}>
              <SelectTrigger className="h-9 sm:w-[160px] rounded-xl text-xs sm:text-sm font-medium border-border/80 bg-background">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 rounded-xl">
                <SelectItem value="all" className="text-xs sm:text-sm">
                  All Locations
                </SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-xs sm:text-sm">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 rounded-xl text-xs sm:text-sm border-border/80 bg-background hover:bg-muted font-medium px-3"
            title="Refresh profit analysis"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""} sm:mr-1.5`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-9 rounded-xl text-xs sm:text-sm border-border/80 bg-background hover:bg-muted font-medium px-3"
            title="Export profit analysis to CSV"
          >
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
