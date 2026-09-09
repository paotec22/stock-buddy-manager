import React, { useState } from "react";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus } from "@/components/ui/status-badge";
import { InventoryImageCell } from "../InventoryImageCell";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Minus, Plus, MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InventoryMobileRowProps {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
  onOpenEditDialog: (item: InventoryItem) => void;
}

export function InventoryMobileRow({
  item,
  isSelected,
  onToggleSelect,
  onQuantityEdit,
  onDelete,
  onOpenEditDialog,
}: InventoryMobileRowProps) {
  const [isUpdatingQty, setIsUpdatingQty] = useState(false);
  const stockStatus = getStockStatus(item.Quantity || 0);

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

  return (
    <div
      className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors bg-card shadow-2xs ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/70 hover:border-border"
      }`}
    >
      {/* Checkbox */}
      <div
        onClick={() => onToggleSelect(item.id)}
        className="shrink-0 cursor-pointer h-7 w-7 flex items-center justify-center -ml-0.5"
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="h-4 w-4 rounded"
        />
      </div>

      {/* Image Thumbnail */}
      <div className="shrink-0 h-9 w-9">
        <InventoryImageCell item={item} />
      </div>

      {/* Info: Description + Status Dot */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onOpenEditDialog(item)}
      >
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-xs text-foreground truncate">
            {item["Item Description"]}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusBadge status={stockStatus} variant="dot" />
          <span className="text-[11px] font-mono font-bold text-foreground">
            {item.Price ? formatCurrency(item.Price) : "₦0.00"}
          </span>
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="inline-flex items-center rounded-md border border-border/80 bg-muted/30 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-l-md rounded-r-none hover:bg-muted active:scale-95 disabled:opacity-30"
          onClick={() => handleStepQuantity(-1)}
          disabled={isUpdatingQty || (item.Quantity || 0) <= 0}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>

        <span className="min-w-[28px] text-center font-mono font-bold text-xs">
          {isUpdatingQty ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin mx-auto text-primary" />
          ) : (
            item.Quantity || 0
          )}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-r-md rounded-l-none hover:bg-muted active:scale-95"
          onClick={() => handleStepQuantity(1)}
          disabled={isUpdatingQty}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* 3-Dot Menu */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 text-xs">
            <DropdownMenuItem onClick={() => onOpenEditDialog(item)} className="cursor-pointer">
              <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" />
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(item)}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
