import React, { useState, useRef, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { InventoryItem } from "@/utils/inventoryUtils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";

export interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onQuantityEdit, onDelete }: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Optional: multi-select mode for long-press on mobile
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // cleanup long press timer on unmount
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedItems.length === 0) return;

    setIsDeleting(true);
    try {
      const location = items.find(item => item.id === selectedItems[0])?.location;

      if (!location) {
        throw new Error("Could not determine location for bulk delete");
      }

      const { error } = await supabase
        .from("inventory list")
        .delete()
        .in("id", selectedItems)
        .eq("location", location);

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedItems.length} items`);
      setSelectedItems([]);
      window.location.reload();
    } catch (err) {
      console.error("Error performing bulk delete:", err);
      toast.error("Failed to delete selected items");
    } finally {
      setIsDeleting(false);
    }
  };

  // Long-press handlers (optional, mobile): enter multi-select mode
  const startLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setMultiSelectMode(true);
    }, 600);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Helper to determine if all are selected
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  // keyboard support: toggle selection on Enter / Space (skip when focusing interactive elements)
  const handleRowKey = (e: React.KeyboardEvent, itemId: number) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "BUTTON" || active.tagName === "A")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSelectItem(itemId);
    }
  };

  return (
    <div className="space-y-4 relative">
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 shadow-lg">
          <InventoryTableActions
            selectedItems={selectedItems}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border shadow-sm bg-card glass-effect">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[50px]">
                <div className="flex items-center gap-2">
                  <span className="sr-only">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    />
                  </span>

                  {selectedItems.length > 0 ? (
                    <div className="text-xs text-foreground/80">
                      {selectedItems.length} selected
                      <button
                        onClick={() => handleSelectAll(false)}
                        className="ml-3 text-xs underline"
                        aria-label="Clear selection"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectAll(true)}
                      className="text-xs text-foreground/70 hover:underline"
                      aria-label="Select all"
                    >
                      Select all
                    </button>
                  )}
                </div>
              </TableHead>

              <TableHead className="text-xs sm:text-sm font-medium">Item Description</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Qty</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Price</TableHead>
              <TableHead className="text-xs sm:text-sm font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <TableRow
                  key={item.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("button") || target.closest("a") || target.closest("input")) {
                      return;
                    }
                    toggleSelectItem(item.id);
                  }}
                  onPointerDown={startLongPress}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onKeyDown={(e) => handleRowKey(e, item.id)}
                  tabIndex={0}
                  className={`group cursor-pointer select-none transition-colors ${
                    isSelected 
                      ? "bg-primary/10 border-primary/20" 
                      : "hover:bg-muted/50"
                  }`}
                  aria-pressed={isSelected}
                >
                  <TableCell className="relative w-[50px]">
                    <span className="sr-only">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked === true && !isSelected) toggleSelectItem(item.id);
                          if (checked === false && isSelected) toggleSelectItem(item.id);
                        }}
                      />
                    </span>

                    {isSelected && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </TableCell>

                  <TableCell className={`${isSelected ? "pl-10" : "pl-4"} pr-4`}>
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{item["Item Description"]}</div>
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {editingQuantity[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={item.Quantity?.toString() || "0"}
                        className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onBlur={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          if (newQuantity !== item.Quantity) {
                            onQuantityEdit(item, newQuantity);
                          }
                          setEditingQuantity(prev => ({ ...prev, [item.id]: false }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setEditingQuantity(prev => ({ ...prev, [item.id]: false }));
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingQuantity(prev => ({ ...prev, [item.id]: true }))}
                        className="text-left hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                      >
                        {item.Quantity || 0}
                      </button>
                    )}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {editingPrice[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.Price?.toString() || "0"}
                        className="w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onBlur={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          if (newPrice !== item.Price) {
                            onPriceEdit(item, newPrice);
                          }
                          setEditingPrice(prev => ({ ...prev, [item.id]: false }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setEditingPrice(prev => ({ ...prev, [item.id]: false }));
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingPrice(prev => ({ ...prev, [item.id]: true }))}
                        className="text-left hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                      >
                        {item.Price ? formatCurrency(item.Price) : "—"}
                      </button>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onDelete(item);
                        }}
                        className="text-destructive text-sm"
                        aria-label={`Delete ${item["Item Description"]}`}
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}