import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SalesTableHeaderProps {
  showActions?: boolean;
}

export function SalesTableHeader({ showActions = false }: SalesTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Item</TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Quantity</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Total</TableHead>
        {showActions && <TableHead className="w-16">Actions</TableHead>}
      </TableRow>
    </TableHeader>
  );
}