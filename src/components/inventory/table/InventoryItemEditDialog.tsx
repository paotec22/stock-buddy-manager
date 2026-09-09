import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { Minus, Plus, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InventoryItemEditDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InventoryItem, updates: { description: string; price: number; quantity: number }) => Promise<void>;
  onDelete?: (item: InventoryItem) => Promise<void>;
}

export function InventoryItemEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete
}: InventoryItemEditDialogProps) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setDescription(item["Item Description"] || "");
      setPrice(item.Price || 0);
      setQuantity(item.Quantity || 0);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (!description.trim()) return;
    setIsSaving(true);
    try {
      await onSave(item, {
        description: description.trim(),
        price: Math.max(0, price),
        quantity: Math.max(0, Math.round(quantity))
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(item);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalValue = (price || 0) * (quantity || 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[95vw] rounded-xl p-5">
          <DialogHeader className="text-left pb-2 border-b border-border/80">
            <DialogTitle className="text-base font-semibold">Edit Inventory Item</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update description, quantity in stock, or unit price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-semibold">
                Item Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Dell Latitude 5420 i7 16GB 512GB"
                className="text-sm resize-none"
              />
            </div>

            {/* Quantity with Stepper */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-quantity" className="text-xs font-semibold">
                  Quantity in Stock
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Location: {item.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 touch-manipulation"
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                  disabled={quantity <= 0}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="text-center font-mono font-bold text-base h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 touch-manipulation"
                  onClick={() => setQuantity(prev => prev + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-price" className="text-xs font-semibold">
                  Unit Price (₦)
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatCurrency(price || 0)}
                </span>
              </div>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="font-mono text-sm h-10"
              />
            </div>

            {/* Calculated Total Value Summary */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Calculated Stock Value:</span>
              <span className="font-bold font-mono text-foreground text-sm">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 pt-2 border-t border-border/80 sm:justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-9 px-2.5"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !description.trim()}
                className="h-9 text-xs font-semibold"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-xl p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove &quot;{item["Item Description"]}&quot; from inventory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="h-8 text-xs mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 text-xs"
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
