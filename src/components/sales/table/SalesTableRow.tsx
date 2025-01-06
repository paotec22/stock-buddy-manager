import { TableCell, TableRow } from "@/components/ui/table";
import { SalesDateCell } from "./SalesDateCell";

interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
}

interface SalesTableRowProps {
  sale: Sale;
  isAdmin: boolean;
  formatCurrency: (amount: number) => string;
  onDateUpdate: (saleId: string, date: Date) => void;
}

export function SalesTableRow({ sale, isAdmin, formatCurrency, onDateUpdate }: SalesTableRowProps) {
  return (
    <TableRow key={sale.id}>
      <TableCell>
        <SalesDateCell
          date={sale.sale_date}
          isAdmin={isAdmin}
          onDateUpdate={(date) => onDateUpdate(sale.id, date)}
        />
      </TableCell>
      <TableCell>{sale.item_name}</TableCell>
      <TableCell>{sale.location}</TableCell>
      <TableCell>{sale.quantity}</TableCell>
      <TableCell>{formatCurrency(sale.sale_price)}</TableCell>
      <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
    </TableRow>
  );
}