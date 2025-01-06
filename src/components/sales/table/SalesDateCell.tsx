import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesDateCellProps {
  date: string;
  isAdmin: boolean;
  onDateUpdate?: (date: Date) => void;
}

export function SalesDateCell({ date, isAdmin, onDateUpdate }: SalesDateCellProps) {
  if (!isAdmin) {
    return <>{format(new Date(date), "dd/MM/yy")}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[140px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(new Date(date), "dd/MM/yy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={new Date(date)}
          onSelect={(date) => date && onDateUpdate?.(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}