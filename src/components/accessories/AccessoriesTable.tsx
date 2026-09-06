import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessoryItem } from "@/types/accessories";
import { formatCurrency } from "@/utils/formatters";
import {
  Pencil,
  Trash2,
  Plus,
  Minus,
  Wrench,
  HelpCircle,
  Tag,
  MapPin,
  Cpu,
  Layers,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AccessoriesTableProps {
  items: AccessoryItem[];
  onEdit: (item: AccessoryItem) => void;
  onDelete: (id: string | number, name: string) => Promise<void>;
  onAdjustQuantity: (id: string | number, delta: number) => Promise<any>;
}

export function AccessoriesTable({
  items,
  onEdit,
  onDelete,
  onAdjustQuantity,
}: AccessoriesTableProps) {
  const [deleteItem, setDeleteItem] = useState<AccessoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | number | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteItem.id, deleteItem.name);
      setDeleteItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuantityClick = async (id: string | number, delta: number) => {
    setAdjustingId(id);
    try {
      await onAdjustQuantity(id, delta);
    } finally {
      setAdjustingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-border/80 shadow-xs">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Wrench className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-base text-foreground">No spare parts found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          No accessories or spare parts match your current filter or location. Add new spare parts or clear search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[260px]">
                Part Name & Specs
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Compatible Equipment
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">
                Stock (Units)
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const qty = Number(item.quantity) || 0;
              const isLowStock = qty > 0 && qty < 5;
              const isOutOfStock = qty === 0;
              const hasPrice = item.price !== null && item.price !== undefined && Number(item.price) > 0;

              return (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  {/* Name & Part Number */}
                  <TableCell className="align-top py-3">
                    <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.condition && item.condition !== "New" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                          {item.condition}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {item.part_number && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {item.part_number}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.notes}>
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="align-top py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.category || "General"}
                    </span>
                  </TableCell>

                  {/* Compatible Equipment */}
                  <TableCell className="align-top py-3">
                    {item.compatible_with ? (
                      <span className="inline-flex items-center text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                        {item.compatible_with}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Universal</span>
                    )}
                  </TableCell>

                  {/* Stock Quantity with adjustment buttons */}
                  <TableCell className="align-top py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-md hover:bg-background"
                        onClick={() => handleQuantityClick(item.id, -1)}
                        disabled={qty <= 0 || adjustingId === item.id}
                        title="Reduce stock by 1"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span
                        className={cn(
                          "px-2 min-w-[2.5rem] font-semibold text-sm",
                          isOutOfStock && "text-destructive",
                          isLowStock && "text-amber-600 dark:text-amber-400",
                          !isOutOfStock && !isLowStock && "text-foreground"
                        )}
                      >
                        {qty} <span className="text-[10px] font-normal text-muted-foreground">{item.unit || "pcs"}</span>
                      </span>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-md hover:bg-background"
                        onClick={() => handleQuantityClick(item.id, 1)}
                        disabled={adjustingId === item.id}
                        title="Increase stock by 1"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {isOutOfStock && (
                      <div className="text-[10px] text-destructive font-medium mt-0.5">Out of stock</div>
                    )}
                    {isLowStock && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Low stock</div>
                    )}
                  </TableCell>

                  {/* Price Column - Highlights the "may not have a specific price" feature */}
                  <TableCell className="align-top py-3">
                    {hasPrice ? (
                      <div className="font-semibold text-sm text-foreground">
                        {formatCurrency(Number(item.price))}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">
                          /{item.unit || "unit"}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/70">
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        No specific price
                      </span>
                    )}
                  </TableCell>

                  {/* Location */}
                  <TableCell className="align-top py-3">
                    <Badge variant="outline" className="text-[11px] font-medium bg-background">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      {item.location}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="align-top py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(item)}
                        title="Edit spare part"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem(item)}
                        title="Delete spare part"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const qty = Number(item.quantity) || 0;
          const isLowStock = qty > 0 && qty < 5;
          const isOutOfStock = qty === 0;
          const hasPrice = item.price !== null && item.price !== undefined && Number(item.price) > 0;

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {item.part_number && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.part_number}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.category}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-background">
                      {item.location}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(item)}
                    aria-label="Edit item"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteItem(item)}
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {item.compatible_with && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Compatible with: </span>
                  {item.compatible_with}
                </div>
              )}

              {item.notes && (
                <p className="text-xs text-muted-foreground/90 bg-muted/40 p-2 rounded-lg">
                  {item.notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                {/* Price */}
                <div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">Price</div>
                  {hasPrice ? (
                    <div className="font-semibold text-sm text-foreground">
                      {formatCurrency(Number(item.price))}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">
                        /{item.unit || "unit"}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      No specific price
                    </span>
                  )}
                </div>

                {/* Stock Controls */}
                <div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground text-right mb-0.5">
                    Stock
                  </div>
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 min-h-[36px] min-w-[36px] rounded-md"
                      onClick={() => handleQuantityClick(item.id, -1)}
                      disabled={qty <= 0 || adjustingId === item.id}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>

                    <span
                      className={cn(
                        "px-2 min-w-[2rem] text-center font-bold text-sm",
                        isOutOfStock && "text-destructive",
                        isLowStock && "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {qty}
                    </span>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 min-h-[36px] min-w-[36px] rounded-md"
                      onClick={() => handleQuantityClick(item.id, 1)}
                      disabled={adjustingId === item.id}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spare Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{deleteItem?.name}</strong> from the accessories
              inventory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Spare Part"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
