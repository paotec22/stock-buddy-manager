import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, WifiOff, CloudOff, Download, Filter, ChevronUp, ChevronDown, X, MapPin } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { StockStatus } from "@/components/ui/status-badge";

interface InventoryHeaderProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  onAddItem: () => void;
  onBulkUpload: () => void;
  onExport?: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter?: StockStatus | null;
  onStatusFilterChange?: (status: StockStatus | null) => void;
  totalItemsCount?: number;
  filteredItemsCount?: number;
  isOffline?: boolean;
  pendingCount?: number;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

export function InventoryHeader({
  selectedLocation,
  onLocationChange,
  onAddItem,
  onBulkUpload,
  onExport,
  searchTerm,
  onSearchChange,
  statusFilter = null,
  onStatusFilterChange,
  totalItemsCount,
  filteredItemsCount,
  isOffline = false,
  pendingCount = 0,
}: InventoryHeaderProps) {
  const [isFilterRowVisible, setIsFilterRowVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem("inventory_filter_row_visible");
    return saved !== null ? saved === "true" : false;
  });

  const toggleFilterRow = () => {
    setIsFilterRowVisible((prev) => {
      const next = !prev;
      localStorage.setItem("inventory_filter_row_visible", String(next));
      return next;
    });
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== null);
  const hasActiveStatusFilter = statusFilter !== null;

  const handleClearAllFilters = () => {
    onSearchChange("");
    onStatusFilterChange?.(null);
  };

  return (
    <div className="bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] space-y-3">
      {/* Top Action Bar */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isOffline && (
            <Badge variant="secondary" className="gap-1.5 bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25 text-xs font-medium">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25 text-xs font-medium">
              <CloudOff className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          )}

          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-medium text-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {selectedLocation}
            </span>
            {totalItemsCount !== undefined && (
              <span className="text-muted-foreground ml-1 font-mono tabular-nums">
                {filteredItemsCount !== undefined && filteredItemsCount !== totalItemsCount ? (
                  <span className="font-semibold text-foreground">
                    {filteredItemsCount} of {totalItemsCount} items
                  </span>
                ) : (
                  <span>{totalItemsCount} items</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons + Status Filter Toggle Button */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Hide/Show Stock Status Filter Row Toggle Button */}
          <Button
            type="button"
            variant={isFilterRowVisible ? "secondary" : "outline"}
            size="sm"
            onClick={toggleFilterRow}
            className={`h-10 sm:h-9 text-xs font-medium rounded-lg gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 touch-manipulation ${
              isFilterRowVisible 
                ? "bg-secondary text-secondary-foreground border-border/80" 
                : "bg-background border-border/80 hover:bg-muted"
            }`}
            title={isFilterRowVisible ? "Hide status filters" : "Show status filters"}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span>{isFilterRowVisible ? "Hide Filters" : "Filters"}</span>
            {hasActiveStatusFilter && (
              <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-background shrink-0" />
            )}
            {isFilterRowVisible ? (
              <ChevronUp className="h-3.5 w-3.5 ml-auto sm:ml-0.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-auto sm:ml-0.5 text-muted-foreground shrink-0" />
            )}
          </Button>

          <Button 
            onClick={onAddItem} 
            size="sm" 
            className="h-10 sm:h-9 bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 font-semibold text-xs rounded-lg whitespace-nowrap shrink-0 touch-manipulation"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span>Add Item</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBulkUpload} 
            className="h-10 sm:h-9 bg-background border-border/80 hover:bg-muted font-medium text-xs rounded-lg whitespace-nowrap shrink-0 touch-manipulation"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span>Bulk Upload</span>
          </Button>

          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport} 
              className="h-10 sm:h-9 bg-background border-border/80 hover:bg-muted font-medium text-xs px-2.5 sm:px-3 rounded-lg whitespace-nowrap shrink-0 touch-manipulation"
              title="Export Inventory"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Always-Visible Primary Search Bar & Branch Selector */}
      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search inventory items by description, SKU, or specification..."
            ariaLabel="Search inventory items"
            className="h-11 sm:h-10 text-sm"
          />
        </div>

        <div className="w-full sm:w-[165px] shrink-0">
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger
              aria-label="Select branch location"
              className="w-full bg-background border-border/80 rounded-lg h-11 sm:h-10 text-sm font-medium"
            >
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location} className="text-sm">
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Stock Status Filter Row */}
      {isFilterRowVisible && (
        <div className="pt-3 border-t border-border/60 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            {/* Stock Status Filter Buttons */}
            {onStatusFilterChange && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full flex-nowrap sm:flex-wrap touch-pan-x">
                <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">
                  Stock Status:
                </span>
                <button
                  type="button"
                  onClick={() => onStatusFilterChange(null)}
                  className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer touch-manipulation ${
                    statusFilter === null
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onStatusFilterChange("in-stock")}
                  className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer touch-manipulation ${
                    statusFilter === "in-stock"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  In Stock
                </button>
                <button
                  type="button"
                  onClick={() => onStatusFilterChange("low-stock")}
                  className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer touch-manipulation ${
                    statusFilter === "low-stock"
                      ? "bg-amber-600 text-white shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  onClick={() => onStatusFilterChange("out-of-stock")}
                  className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer touch-manipulation ${
                    statusFilter === "out-of-stock"
                      ? "bg-rose-600 text-white shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            )}

            {/* Clear Filters & Hide Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset All</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleFilterRow}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
                title="Hide status filter row"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hide</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* When status filter row is collapsed but a status filter is active, show compact bar */}
      {!isFilterRowVisible && hasActiveStatusFilter && statusFilter && (
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/50 text-xs text-muted-foreground animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Filter className="h-3 w-3 text-primary" />
              Active Status Filter:
            </span>
            <span className="font-medium text-foreground capitalize">
              {statusFilter.replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStatusFilterChange?.(null)}
              className="text-xs text-destructive hover:underline font-medium cursor-pointer"
            >
              Clear
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={toggleFilterRow}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Show Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
