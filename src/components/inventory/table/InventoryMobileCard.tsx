import React, { useState } from "react";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus } from "@/components/ui/status-badge";
import { InventoryImageCell } from "../InventoryImageCell";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Minus, Plus, MoreVertical, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InventoryMobileCardProps {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDescriptionEdit: (item: InventoryItem, newDescription: string) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
  onOpenEditDialog: (item: InventoryItem) => void;
}

export function InventoryMobileCard({
  item,
  isSelected,
  onToggleSelect,
  onPriceEdit,
  onQuantityEdit,
  onDescriptionEdit,
  onDelete,
  onOpenEditDialog
}: InventoryMobileCardProps) {
  const [isUpdatingQty, setIsUpdatingQty] = useState(false);
  const [editingPriceInline, setEditingPriceInline] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.Price?.toString() || "0");
  const [editingDescInline, setEditingDescInline] = useState(false);
  const [tempDesc, setTempDesc] = useState(item["Item Description"] || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stockStatus = getStockStatus(item.Quantity || 0);

  // Stepper handlers
  const handleStepQuantity = async (delta: number) => {
    const currentQty = item.Quantity || 0;
    const newQty = Math.max(0, currentQty + delta);
    if (newQty === currentQty) return;

    setIsUpdatingQty(true);
    try {
      await onQuantityEdit(item, newQty);
    } finally {
      setIsUpdatingQty(false);
    }
  };

  const handleSavePrice = async () => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== item.Price) {
      await onPriceEdit(item, newPrice);
    }
    setEditingPriceInline(false);
  };

  const handleSaveDesc = async () => {
    const trimmed = tempDesc.trim();
    if (trimmed && trimmed !== item["Item Description"]) {
      await onDescriptionEdit(item, trimmed);
    }
    setEditingDescInline(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`relative rounded-xl border transition-all duration-150 bg-card p-3.5 shadow-xs ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border/80 hover:border-border"
        }`}
      >
        {/* Top Header: Select Checkbox, Image, Description, and 3-dot Menu */}
        <div className="flex items-start gap-3">
          {/* Checkbox with large touch target */}
          <div className="pt-1 shrink-0">
            <div
              onClick={() => onToggleSelect(item.id)}
              className="h-7 w-7 flex items-center justify-center cursor-pointer rounded-md hover:bg-muted/80 transition-colors"
              aria-label={isSelected ? "Deselect item" : "Select item"}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(item.id)}
                className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
            </div>
          </div>

          {/* Product Thumbnail */}
          <div className="shrink-0 pt-0.5">
            <InventoryImageCell item={item} />
          </div>

          {/* Description & Status */}
          <div className="flex-1 min-w-0 pr-1">
            {editingDescInline ? (
              <div className="flex items-center gap-1.5 mb-1.5">
                <input
                  type="text"
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  className="w-full text-xs font-medium px-2 py-1 border border-input rounded bg-background"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveDesc();
                    if (e.key === "Escape") setEditingDescInline(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-primary shrink-0"
                  onClick={handleSaveDesc}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground shrink-0"
                  onClick={() => {
                    setTempDesc(item["Item Description"]);
                    setEditingDescInline(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p
                onClick={() => onOpenEditDialog(item)}
                className="font-medium text-xs sm:text-sm text-foreground leading-snug break-words line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              >
                {item["Item Description"]}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={stockStatus} size="sm" />
              {item.location && (
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {item.location}
                </span>
              )}
            </div>
          </div>

          {/* 3-Dots Action Menu */}
          <div className="shrink-0 -mr-1 -mt-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                  aria-label="Item options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuItem onClick={() => onOpenEditDialog(item)} className="cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" />
                  Quick Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingDescInline(true)} className="cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Edit Description
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingPriceInline(true)} className="cursor-pointer">
                  <span className="font-mono mr-2 font-bold text-xs">₦</span>
                  Edit Price
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Divider */}
        <div className="my-2.5 border-t border-border/50" />

        {/* Bottom Control Row: Price & Quantity Stepper */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Price Column */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider">
              Unit Price
            </span>
            {editingPriceInline ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="w-24 text-xs font-mono font-bold px-1.5 py-0.5 border border-input rounded bg-background"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSavePrice();
                    if (e.key === "Escape") setEditingPriceInline(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-primary shrink-0"
                  onClick={handleSavePrice}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground shrink-0"
                  onClick={() => {
                    setTempPrice(item.Price?.toString() || "0");
                    setEditingPriceInline(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingPriceInline(true)}
                className="text-left font-mono font-bold text-sm text-foreground hover:text-primary transition-colors flex items-baseline gap-1"
                title="Tap to edit price"
              >
                <span>{item.Price ? formatCurrency(item.Price) : "₦0.00"}</span>
                <Edit2 className="h-2.5 w-2.5 opacity-40 inline" />
              </button>
            )}
          </div>

          {/* Quantity Stepper Controller */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block tracking-wider mb-0.5">
              Quantity
            </span>
            <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-lg rounded-r-none hover:bg-muted active:scale-95 touch-manipulation disabled:opacity-30"
                onClick={() => handleStepQuantity(-1)}
                disabled={isUpdatingQty || (item.Quantity || 0) <= 0}
                aria-label="Decrease quantity by 1"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>

              <button
                type="button"
                onClick={() => onOpenEditDialog(item)}
                className="min-w-[40px] px-1.5 text-center font-mono font-bold text-xs text-foreground hover:text-primary transition-colors"
                title="Tap to enter exact quantity"
              >
                {isUpdatingQty ? (
                  <Loader2 className="h-3 w-3 animate-spin mx-auto text-primary" />
                ) : (
                  <span>{item.Quantity || 0}</span>
                )}
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-lg rounded-l-none hover:bg-muted active:scale-95 touch-manipulation"
                onClick={() => handleStepQuantity(1)}
                disabled={isUpdatingQty}
                aria-label="Increase quantity by 1"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-xs rounded-xl p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Remove &quot;{item["Item Description"]}&quot; from inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="h-8 text-xs mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 text-xs"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
