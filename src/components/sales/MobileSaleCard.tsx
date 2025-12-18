import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp, MapPin, Package, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
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
  formatCurrency: (amount: number) => string;
  onDelete: (saleId: string) => void;
}

export function MobileSaleCard({ sale, isAdmin, formatCurrency, onDelete }: MobileSaleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(sale.id);
    setDeleteOpen(false);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{sale.item_name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(sale.sale_date), "MMM dd, yyyy")}</span>
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
          <div>
            @ {formatCurrency(sale.sale_price)}
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
