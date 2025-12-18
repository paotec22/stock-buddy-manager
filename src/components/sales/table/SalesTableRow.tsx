import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Sale {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  location: string;
  notes?: string | null;
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(sale.id);
    setDeleteOpen(false);
  };

  const hasLongNotes = sale.notes && sale.notes.length > 30;
  const truncatedNotes = hasLongNotes ? `${sale.notes!.substring(0, 30)}...` : sale.notes;

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors">
      <TableCell>
        <SalesDateCell
          date={sale.sale_date}
          isAdmin={canEditDates}
          onDateUpdate={(date) => onDateUpdate(sale.id, date)}
        />
      </TableCell>
      <TableCell className="font-medium">{sale.item_name}</TableCell>
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
        <span className="font-semibold text-primary">{formatCurrency(sale.total_amount)}</span>
      </TableCell>
      <TableCell className="max-w-[200px]">
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
        <TableCell className="w-16">
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
