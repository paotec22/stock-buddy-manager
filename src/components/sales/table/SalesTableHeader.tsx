import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SalesTableHeader() {
  return (
    <TableHeader>
      <TableRow>
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