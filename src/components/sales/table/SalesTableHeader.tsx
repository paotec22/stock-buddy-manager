import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortField = 'sale_date' | 'item_name' | 'location' | 'quantity' | 'sale_price' | 'total_amount';
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
}

function SortableHeader({ field, label, currentField, direction, onSort, className }: SortableHeaderProps) {
  const isActive = currentField === field;
  
  return (
    <TableHead 
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-4 w-4 text-primary" />
          ) : (
            <ArrowDown className="h-4 w-4 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}

export function SalesTableHeader({ showActions = false, sortField, sortDirection, onSort }: SalesTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 bg-background z-10">
      <TableRow>
        <SortableHeader field="sale_date" label="Date" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="item_name" label="Item" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="location" label="Location" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="quantity" label="Quantity" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="sale_price" label="Price" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <SortableHeader field="total_amount" label="Total" currentField={sortField} direction={sortDirection} onSort={onSort} />
        <TableHead>Notes</TableHead>
        {showActions && <TableHead className="w-16">Actions</TableHead>}
      </TableRow>
    </TableHeader>
  );
}
