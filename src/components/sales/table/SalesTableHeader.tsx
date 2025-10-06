import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface SalesTableHeaderProps {
  showCheckbox?: boolean;
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: (checked: boolean) => void;
}

export function SalesTableHeader({ 
  showCheckbox = false, 
  selectedCount = 0, 
  totalCount = 0,
  onSelectAll 
}: SalesTableHeaderProps) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <TableHeader>
      <TableRow>
        {showCheckbox && (
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all sales"
            />
          </TableHead>
        )}
        <TableHead>Date</TableHead>
        <TableHead>Item</TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Quantity</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Total</TableHead>
      </TableRow>
    </TableHeader>
  );
}