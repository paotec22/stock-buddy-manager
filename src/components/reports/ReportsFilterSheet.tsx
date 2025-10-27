import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { format } from "date-fns";

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
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-11 min-w-11">
          <Filter className="h-4 w-4" />
          <span className="ml-2">Filters</span>
          {(dateFrom || dateTo) && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filter Reports</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">From Date</label>
              {dateFrom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDateFromChange(undefined)}
                  className="h-8 text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            {dateFrom && (
              <p className="text-sm text-muted-foreground">{format(dateFrom, "PPP")}</p>
            )}
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={onDateFromChange}
              className="rounded-md border w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">To Date</label>
              {dateTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDateToChange(undefined)}
                  className="h-8 text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            {dateTo && (
              <p className="text-sm text-muted-foreground">{format(dateTo, "PPP")}</p>
            )}
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={onDateToChange}
              className="rounded-md border w-full"
            />
          </div>

          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              onClick={onClearDates}
              className="w-full h-11"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
