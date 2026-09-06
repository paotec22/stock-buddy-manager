import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { SalesDateCell } from "./SalesDateCell";
import { SalesPriceCell } from "./SalesPriceCell";
import { PaymentStatusBadge } from "../PaymentStatusBadge";
import { Sale } from "../types";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SalesTableRowProps {
  sale: Sale;
  canEditDates: boolean;
  isAdmin: boolean;
  formatCurrency: (amount: number) => string;
  onDateUpdate: (saleId: string, date: Date) => void;
  onPriceUpdate: (saleId: string, price: number) => void;
  onDelete: (saleId: string) => void;
  onUpdatePayment?: (sale: Sale) => void;
}

export function SalesTableRow({ 
  sale, 
  canEditDates, 
  isAdmin, 
  formatCurrency, 
  onDateUpdate, 
  onPriceUpdate,
  onDelete,
  onUpdatePayment
}: SalesTableRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(sale.id);
    setDeleteOpen(false);
  };

  const hasLongNotes = sale.notes && sale.notes.length > 30;
  const truncatedNotes = hasLongNotes ? `${sale.notes!.substring(0, 30)}...` : sale.notes;

  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      <TableCell className="py-2.5">
        <SalesDateCell
          date={sale.sale_date}
          isAdmin={canEditDates}
          onDateUpdate={(date) => onDateUpdate(sale.id, date)}
        />
      </TableCell>
      <TableCell className="font-medium text-foreground py-2.5">{sale.item_name}</TableCell>
      <TableCell className="text-muted-foreground py-2.5">{sale.location}</TableCell>
      <TableCell className="text-right font-mono tabular-nums py-2.5 text-foreground">
        {sale.quantity.toLocaleString()}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums py-2.5">
        <SalesPriceCell
          price={sale.sale_price}
          isAdmin={isAdmin}
          formatCurrency={formatCurrency}
          onPriceUpdate={(price) => onPriceUpdate(sale.id, price)}
        />
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums font-semibold text-foreground py-2.5">
        {formatCurrency(sale.total_amount)}
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center gap-1.5">
          <PaymentStatusBadge status={sale.payment_status} />
          {sale.payment_status !== 'paid' && canEditDates && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onUpdatePayment?.(sale)}
              title="Update payment"
            >
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-[180px] py-2.5">
        {sale.notes ? (
          hasLongNotes ? (
            <Popover open={notesOpen} onOpenChange={setNotesOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span className="truncate">{truncatedNotes}</span>
                  {notesOpen ? (
                    <ChevronUp className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="text-sm">{sale.notes}</p>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-muted-foreground">{sale.notes}</span>
          )
        ) : (
          <span className="text-muted-foreground/50">-</span>
        )}
      </TableCell>
      {isAdmin && (
        <TableCell className="w-16 text-right py-2.5">
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
