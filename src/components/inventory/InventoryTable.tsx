import React, { useState, useMemo } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { InventoryTableActions } from "./table/InventoryTableActions";
import { InventoryItem } from "@/utils/inventoryUtils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus } from "@/components/ui/status-badge";
import { InventoryImageCell } from "./InventoryImageCell";
import { InventoryMobileCard } from "./table/InventoryMobileCard";
import { InventoryMobileRow } from "./table/InventoryMobileRow";
import { InventoryItemEditDialog } from "./table/InventoryItemEditDialog";
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Trash2,
  Edit2,
  Check,
  X,
  CheckSquare,
  Square
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

export interface InventoryTableProps {
  items: InventoryItem[];
  onPriceEdit: (item: InventoryItem, newPrice: number) => Promise<void>;
  onQuantityEdit: (item: InventoryItem, newQuantity: number) => Promise<void>;
  onDescriptionEdit: (item: InventoryItem, newDescription: string) => Promise<void>;
  onDelete: (item: InventoryItem) => Promise<void>;
}

export function InventoryTable({
  items,
  onPriceEdit,
  onQuantityEdit,
  onDescriptionEdit,
  onDelete
}: InventoryTableProps) {
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [editingDescription, setEditingDescription] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"cards" | "compact">("cards");
  const [sortBy, setSortBy] = useState<string>("default");
  const [activeEditItem, setActiveEditItem] = useState<InventoryItem | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Sorting logic
  const sortedItems = useMemo(() => {
    if (sortBy === "default") return items;

    const list = [...items];
    switch (sortBy) {
      case "name-asc":
        return list.sort((a, b) =>
          (a["Item Description"] || "").localeCompare(b["Item Description"] || "")
        );
      case "name-desc":
        return list.sort((a, b) =>
          (b["Item Description"] || "").localeCompare(a["Item Description"] || "")
        );
      case "price-desc":
        return list.sort((a, b) => (b.Price || 0) - (a.Price || 0));
      case "price-asc":
        return list.sort((a, b) => (a.Price || 0) - (b.Price || 0));
      case "qty-asc":
        return list.sort((a, b) => (a.Quantity || 0) - (b.Quantity || 0));
      case "qty-desc":
        return list.sort((a, b) => (b.Quantity || 0) - (a.Quantity || 0));
      default:
        return list;
    }
  }, [items, sortBy]);

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
      setShowBulkDeleteConfirm(false);
      window.location.reload();
    } catch (err) {
      console.error("Error performing bulk delete:", err);
      toast.error("Failed to delete selected items");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveFromDialog = async (
    item: InventoryItem,
    updates: { description: string; price: number; quantity: number }
  ) => {
    if (updates.description !== item["Item Description"]) {
      await onDescriptionEdit(item, updates.description);
    }
    if (updates.price !== item.Price) {
      await onPriceEdit(item, updates.price);
    }
    if (updates.quantity !== item.Quantity) {
      await onQuantityEdit(item, updates.quantity);
    }
  };

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <div className="space-y-4 relative">
      {/* ========================================================================= */}
      {/* DESKTOP SELECTION BAR (hidden on mobile, mobile has floating bottom bar) */}
      {/* ========================================================================= */}
      {selectedItems.length > 0 && (
        <div className="hidden md:flex items-center justify-between bg-primary/5 p-3.5 rounded-xl border border-primary/20 shadow-xs mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => handleSelectAll(true)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Select all ({items.length})
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Clear selection
            </button>
          </div>
          <InventoryTableActions
            selectedItems={selectedItems}
            onBulkDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE CONTROLS HEADER (Sort, View Mode Toggle, and Select All Header)     */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col gap-2 pb-1">
        <div className="flex items-center justify-between gap-1.5 bg-card border border-border/80 rounded-xl p-2 sm:p-2.5 shadow-2xs">
          {/* Select All Toggle on Mobile */}
          <button
            type="button"
            onClick={() => handleSelectAll(!allSelected)}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-foreground py-1 px-1.5 rounded hover:bg-muted transition-colors cursor-pointer touch-manipulation min-w-0"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
            ) : selectedItems.length > 0 ? (
              <div className="h-4 w-4 rounded bg-primary/20 border border-primary flex items-center justify-center shrink-0">
                <span className="h-1.5 w-1.5 rounded-xs bg-primary" />
              </div>
            ) : (
              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">
              {selectedItems.length > 0
                ? `${selectedItems.length} sel`
                : `All (${items.length})`}
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs px-2 gap-1 bg-background border-border/80 w-[105px] sm:w-[125px]">
                <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="qty-asc">Qty: Low Stock First</SelectItem>
                <SelectItem value="qty-desc">Qty: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle: Cards vs Compact List */}
            <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 shrink-0">
              <button
                type="button"
                onClick={() => setMobileViewMode("cards")}
                className={`p-1.5 rounded-md text-xs transition-colors touch-manipulation ${
                  mobileViewMode === "cards"
                    ? "bg-background text-foreground shadow-2xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Card View"
                aria-label="Switch to Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("compact")}
                className={`p-1.5 rounded-md text-xs transition-colors touch-manipulation ${
                  mobileViewMode === "compact"
                    ? "bg-background text-foreground shadow-2xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Compact View"
                aria-label="Switch to Compact View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE ITEM LIST (Optimized Touch Cards or Compact Rows)                  */}
      {/* ========================================================================= */}
      <div
        className={`md:hidden space-y-2.5 ${
          selectedItems.length > 0 ? "pb-32" : "pb-12"
        }`}
      >
        {sortedItems.map((item) => {
          const isSelected = selectedItems.includes(item.id);

          if (mobileViewMode === "compact") {
            return (
              <InventoryMobileRow
                key={item.id}
                item={item}
                isSelected={isSelected}
                onToggleSelect={toggleSelectItem}
                onQuantityEdit={onQuantityEdit}
                onDelete={onDelete}
                onOpenEditDialog={setActiveEditItem}
              />
            );
          }

          return (
            <InventoryMobileCard
              key={item.id}
              item={item}
              isSelected={isSelected}
              onToggleSelect={toggleSelectItem}
              onPriceEdit={onPriceEdit}
              onQuantityEdit={onQuantityEdit}
              onDescriptionEdit={onDescriptionEdit}
              onDelete={onDelete}
              onOpenEditDialog={setActiveEditItem}
            />
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STICKY FLOATING SELECTION BAR                                      */}
      {/* ========================================================================= */}
      {selectedItems.length > 0 && (
        <div className="md:hidden fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-6 sm:right-6 z-40 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              {selectedItems.length}
            </div>
            <span className="text-xs font-semibold">selected</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1 touch-manipulation cursor-pointer"
            >
              Clear
            </button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="h-9 text-xs font-semibold px-3.5 shadow-xs touch-manipulation cursor-pointer"
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete ({selectedItems.length})
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP TABLE VIEW (Preserved & Enhanced with Clean Columns & Actions)    */}
      {/* ========================================================================= */}
      <div className="hidden md:block rounded-xl border border-border/80 bg-card overflow-auto shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] max-h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-muted/70 backdrop-blur-xs">
            <TableRow className="border-b border-border/80 hover:bg-transparent">
              <TableHead className="w-10 h-10 px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-10">
                Item Description
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-10 w-28 text-center">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-10 w-24 text-right">
                Qty
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-10 w-32 text-right">
                Price
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-10 w-20 text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);

              return (
                <TableRow
                  key={item.id}
                  className={`group select-none transition-colors border-b border-border/70 ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Selection Checkbox */}
                  <TableCell className="w-10 px-3 py-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>

                  {/* Description & Thumbnail */}
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-3">
                      <InventoryImageCell item={item} />
                      {editingDescription[item.id] ? (
                        <input
                          type="text"
                          defaultValue={item["Item Description"]}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          onBlur={(e) => {
                            const newDescription = e.target.value.trim();
                            if (
                              newDescription &&
                              newDescription !== item["Item Description"]
                            ) {
                              onDescriptionEdit(item, newDescription);
                            }
                            setEditingDescription(prev => ({
                              ...prev,
                              [item.id]: false
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            } else if (e.key === "Escape") {
                              setEditingDescription(prev => ({
                                ...prev,
                                [item.id]: false
                              }));
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() =>
                            setEditingDescription(prev => ({
                              ...prev,
                              [item.id]: true
                            }))
                          }
                          className="text-left font-medium text-sm hover:bg-muted/60 px-1.5 py-0.5 rounded transition-colors w-full truncate"
                          title="Click to edit description"
                        >
                          {item["Item Description"]}
                        </button>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2.5 text-center">
                    <StatusBadge
                      status={getStockStatus(item.Quantity || 0)}
                      size="sm"
                    />
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="py-2.5 text-right">
                    {editingQuantity[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={item.Quantity?.toString() || "0"}
                        className="w-20 px-2 py-1 text-sm font-mono tabular-nums border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
                        onBlur={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          if (newQuantity !== item.Quantity) {
                            onQuantityEdit(item, newQuantity);
                          }
                          setEditingQuantity(prev => ({
                            ...prev,
                            [item.id]: false
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          } else if (e.key === "Escape") {
                            setEditingQuantity(prev => ({
                              ...prev,
                              [item.id]: false
                            }));
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setEditingQuantity(prev => ({
                            ...prev,
                            [item.id]: true
                          }))
                        }
                        className="inline-flex items-center justify-end text-right font-mono tabular-nums text-sm font-medium hover:bg-muted/60 px-2 py-1 rounded transition-colors w-full"
                        title="Click to edit quantity"
                      >
                        {item.Quantity || 0}
                      </button>
                    )}
                  </TableCell>

                  {/* Price */}
                  <TableCell className="py-2.5 text-right">
                    {editingPrice[item.id] ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.Price?.toString() || "0"}
                        className="w-24 px-2 py-1 text-sm font-mono tabular-nums border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-right"
                        onBlur={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          if (newPrice !== item.Price) {
                            onPriceEdit(item, newPrice);
                          }
                          setEditingPrice(prev => ({ ...prev, [item.id]: false }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          } else if (e.key === "Escape") {
                            setEditingPrice(prev => ({ ...prev, [item.id]: false }));
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setEditingPrice(prev => ({ ...prev, [item.id]: true }))
                        }
                        className="inline-flex items-center justify-end text-right font-mono tabular-nums text-sm font-semibold text-foreground hover:bg-muted/60 px-2 py-1 rounded transition-colors w-full"
                        title="Click to edit price"
                      >
                        {item.Price ? formatCurrency(item.Price) : "—"}
                      </button>
                    )}
                  </TableCell>

                  {/* Desktop Quick Actions */}
                  <TableCell className="py-2.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                        onClick={() => setActiveEditItem(item)}
                        title="Edit Item"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md"
                        onClick={() => setItemToDelete(item)}
                        title="Delete Item"
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

      {/* ========================================================================= */}
      {/* EDIT MODAL DIALOG (Used across both mobile & desktop)                     */}
      {/* ========================================================================= */}
      <InventoryItemEditDialog
        item={activeEditItem}
        open={!!activeEditItem}
        onOpenChange={(open) => {
          if (!open) setActiveEditItem(null);
        }}
        onSave={handleSaveFromDialog}
        onDelete={onDelete}
      />

      {/* ========================================================================= */}
      {/* BULK DELETE CONFIRMATION DIALOG                                           */}
      {/* ========================================================================= */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-xl p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Delete {selectedItems.length} items?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete {selectedItems.length} selected items
              from inventory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="h-8.5 text-xs mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8.5 text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete Items"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* SINGLE ITEM DELETE CONFIRMATION DIALOG (for desktop actions)               */}
      {/* ========================================================================= */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-xl p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove &quot;{itemToDelete?.["Item Description"]}&quot; from inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="h-8.5 text-xs mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (itemToDelete) {
                  await onDelete(itemToDelete);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8.5 text-xs font-semibold"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
