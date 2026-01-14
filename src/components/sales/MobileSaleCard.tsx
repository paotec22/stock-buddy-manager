import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, ChevronDown, ChevronUp, MapPin, Package, Calendar as CalendarIcon, Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
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

interface MobileSaleCardProps {
  sale: Sale;
  isAdmin: boolean;
  canEditDates?: boolean;
  formatCurrency: (amount: number) => string;
  onDelete: (saleId: string) => void;
  onDateUpdate?: (saleId: string, newDate: Date) => void;
  onPriceUpdate?: (saleId: string, newPrice: number) => void;
}

export function MobileSaleCard({ 
  sale, 
  isAdmin, 
  canEditDates = false,
  formatCurrency, 
  onDelete,
  onDateUpdate,
  onPriceUpdate
}: MobileSaleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState(sale.sale_price.toString());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(sale.id);
    setDeleteOpen(false);
  };

  const handlePriceSave = () => {
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice >= 0 && onPriceUpdate) {
      onPriceUpdate(sale.id, newPrice);
    }
    setIsEditingPrice(false);
  };

  const handlePriceCancel = () => {
    setEditPrice(sale.sale_price.toString());
    setIsEditingPrice(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateUpdate) {
      onDateUpdate(sale.id, date);
      setDatePickerOpen(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{sale.item_name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <CalendarIcon className="h-3 w-3" />
              {canEditDates && onDateUpdate ? (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="hover:text-foreground underline-offset-2 hover:underline transition-colors">
                      {format(new Date(sale.sale_date), "MMM dd, yyyy")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(sale.sale_date)}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span>{format(new Date(sale.sale_date), "MMM dd, yyyy")}</span>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {formatCurrency(sale.total_amount)}
          </Badge>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{sale.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Qty: {sale.quantity}</span>
          </div>
          <div className="flex items-center gap-1">
            {canEditDates && onPriceUpdate ? (
              isEditingPrice ? (
                <div className="flex items-center gap-1">
                  <span>@</span>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="h-6 w-20 text-xs px-1"
                    min="0"
                    step="0.01"
                  />
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handlePriceSave}>
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handlePriceCancel}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingPrice(true)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  @ {formatCurrency(sale.sale_price)}
                  <Pencil className="h-3 w-3 ml-1" />
                </button>
              )
            ) : (
              <span>@ {formatCurrency(sale.sale_price)}</span>
            )}
          </div>
        </div>

        {/* Expandable Notes Section */}
        {sale.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>Notes</span>
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                {sale.notes}
              </p>
            )}
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-border flex justify-end">
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
