import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortField = 'sale_date' | 'item_name' | 'location' | 'quantity' | 'sale_price' | 'total_amount' | 'payment_status';
export type SortDirection = 'asc' | 'desc';

interface SalesTableHeaderProps {
  showActions?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField?: SortField;
  direction?: SortDirection;
  onSort?: (field: SortField) => void;
  className?: string;
  align?: "left" | "right";
}

function SortableHeader({ field, label, currentField, direction, onSort, className, align = "left" }: SortableHeaderProps) {
  const isActive = currentField === field;
  
  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        align === "right" && "text-right",
        className
      )}
      onClick={() => onSort?.(field)}
    >
      <div className={cn("flex items-center gap-1", align === "right" ? "justify-end" : "justify-start")}>
        <span>{label}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
        )}
      </div>
    </TableHead>
  );
}

export function SalesTableHeader({ showActions = false, sortField, sortDirection, onSort }: SalesTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
      <TableRow className="hover:bg-transparent">
        <SortableHeader field="sale_date" label="Date" currentField={sortField} direction={sortDirection} onSort={onSort} className="w-[120px]" />
        <SortableHeader field="item_name" label="Item" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="location" label="Location" currentField={sortField} direction={sortDirection} onSort={onSort} className="w-[120px]" />
        <SortableHeader field="quantity" label="Qty" currentField={sortField} direction={sortDirection} onSort={onSort} align="right" className="w-[90px]" />
        <SortableHeader field="sale_price" label="Unit Price" currentField={sortField} direction={sortDirection} onSort={onSort} align="right" className="w-[130px]" />
        <SortableHeader field="total_amount" label="Total" currentField={sortField} direction={sortDirection} onSort={onSort} align="right" className="w-[140px]" />
        <SortableHeader field="payment_status" label="Status" currentField={sortField} direction={sortDirection} onSort={onSort} className="w-[120px]" />
        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</TableHead>
        {showActions && <TableHead className="w-16 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>}
      </TableRow>
    </TableHeader>
  );
}
