import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SalesDateCell } from "./SalesDateCell";
import { SalesPriceCell } from "./SalesPriceCell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  onDelete: (saleId: string) => void;
}

export function SalesTableRow({ 
  sale, 
  canEditDates, 
  isAdmin, 
  formatCurrency, 
  onDateUpdate, 
  onPriceUpdate,
  onDelete
}: SalesTableRowProps) {
  const [open, setOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(sale.id);
    setOpen(false);
  };

  return (
    <TableRow key={sale.id}>
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
      {isAdmin && (
        <TableCell className="w-16">
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this sale record for {sale.item_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      )}
    </TableRow>
  );
}