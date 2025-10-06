import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SalesDateCell } from "./SalesDateCell";
import { SalesPriceCell } from "./SalesPriceCell";

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
  canEditDates: boolean;
  isAdmin: boolean;
  formatCurrency: (amount: number) => string;
  onDateUpdate: (saleId: string, date: Date) => void;
  onPriceUpdate: (saleId: string, price: number) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (saleId: string, checked: boolean) => void;
}

export function SalesTableRow({ 
  sale, 
  canEditDates, 
  isAdmin, 
  formatCurrency, 
  onDateUpdate, 
  onPriceUpdate,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: SalesTableRowProps) {
  return (
    <TableRow key={sale.id}>
      {showCheckbox && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(sale.id, checked as boolean)}
            aria-label="Select sale"
          />
        </TableCell>
      )}
      <TableCell>
        <SalesDateCell
          date={sale.sale_date}
          isAdmin={canEditDates}
          onDateUpdate={(date) => onDateUpdate(sale.id, date)}
        />
      </TableCell>
      <TableCell>{sale.item_name}</TableCell>
      <TableCell>{sale.location}</TableCell>
      <TableCell>{sale.quantity}</TableCell>
      <TableCell>
        <SalesPriceCell
          price={sale.sale_price}
          isAdmin={isAdmin}
          formatCurrency={formatCurrency}
          onPriceUpdate={(price) => onPriceUpdate(sale.id, price)}
        />
      </TableCell>
      <TableCell>
        <span className="currency-display">{formatCurrency(sale.total_amount)}</span>
      </TableCell>
    </TableRow>
  );
}