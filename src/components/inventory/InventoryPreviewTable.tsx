import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewInventoryItem } from "@/utils/inventoryUtils";

interface InventoryPreviewTableProps {
  items: NewInventoryItem[];
}

export function InventoryPreviewTable({ items }: InventoryPreviewTableProps) {
  return (
    <div className="max-h-[400px] overflow-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item["Item Description"]}</TableCell>
              <TableCell>${item.Price.toFixed(2)}</TableCell>
              <TableCell>{item.Quantity}</TableCell>
              <TableCell>${item.Total.toFixed(2)}</TableCell>
              <TableCell>{item.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}