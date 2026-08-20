import React, { useState, useRef, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { InventoryItem } from "@/utils/inventoryUtils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus } from "@/components/ui/status-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { InventoryImageCell } from "./InventoryImageCell";

export interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDescriptionEdit: (item: InventoryItem, newDescription: string) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({ items, onPriceEdit, onQuantityEdit, onDescriptionEdit, onDelete }: InventoryTableProps) {
  const isMobile = useIsMobile();
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [editingDescription, setEditingDescription] = useState<{ [key: string]: boolean }>({});
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
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/10 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedItems.length} items selected
            </span>
            <button
              onClick={() => handleSelectAll(true)}
              className="text-xs text-primary hover:underline"
              aria-label="Select all"
            >
              Select all
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-xs text-muted-foreground hover:underline"
              aria-label="Clear selection"
            >
              Clear
            </button>
          </div>
          <InventoryTableActions
            selectedItems={selectedItems}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-10">Item Description</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-10 w-32">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-10 w-24">Qty</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-10 w-32">Price</TableHead>
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
                  className={`group cursor-pointer select-none transition-colors border-b border-border/70 ${
                    isSelected 
                      ? "bg-primary/10 hover:bg-primary/15" 
                      : "hover:bg-muted/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <TableCell className="relative py-2.5" onClick={(e) => e.stopPropagation()}>
                    {isSelected && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}

                    <div className={`flex items-center gap-3 ${isSelected ? "pl-5" : ""}`}>
                      <InventoryImageCell item={item} />
                      {editingDescription[item.id] ? (
                        <input
                          type="text"
                          defaultValue={item["Item Description"]}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          onBlur={(e) => {
                            const newDescription = e.target.value.trim();
                            if (newDescription && newDescription !== item["Item Description"]) {
                              onDescriptionEdit(item, newDescription);
                            }
                            setEditingDescription(prev => ({ ...prev, [item.id]: false }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingDescription(prev => ({ ...prev, [item.id]: false }));
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingDescription(prev => ({ ...prev, [item.id]: true }))}
                          className="text-left font-medium text-sm hover:bg-muted/60 px-1.5 py-0.5 rounded transition-colors w-full truncate"
                        >
                          {item["Item Description"]}
                        </button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <StatusBadge 
                      status={getStockStatus(item.Quantity || 0)} 
                      size="sm"
                      variant={isMobile ? "dot" : "default"}
                    />
                  </TableCell>

                  <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                    {editingQuantity[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={item.Quantity?.toString() || "0"}
                        className="w-20 px-2 py-1 text-sm font-mono tabular-nums border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                        className="text-left font-mono tabular-nums text-sm font-medium hover:bg-muted/60 px-2 py-0.5 rounded transition-colors"
                      >
                        {item.Quantity || 0}
                      </button>
                    )}
                  </TableCell>

                  <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                    {editingPrice[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.Price?.toString() || "0"}
                        className="w-24 px-2 py-1 text-sm font-mono tabular-nums border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                        className="text-left font-mono tabular-nums text-sm font-semibold text-foreground hover:bg-muted/60 px-2 py-0.5 rounded transition-colors"
                      >
                        {item.Price ? formatCurrency(item.Price) : "—"}
                      </button>
                    )}
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