import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParseDate } from "@/utils/dateParsing";

interface SalesDateCellProps {
  date: string;
  isAdmin: boolean;
  onDateUpdate?: (date: Date) => void;
}

export function SalesDateCell({ date, isAdmin, onDateUpdate }: SalesDateCellProps) {
  const parsed = safeParseDate(date);
  const formattedDate = parsed ? format(parsed, "dd/MM/yy") : (date || "—");

  if (!isAdmin) {
    return <span>{formattedDate}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[140px] justify-start text-left font-normal text-xs h-8 cursor-pointer",
            !parsed && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          <span>{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={parsed || undefined}
          onSelect={(d) => d && onDateUpdate?.(d)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}