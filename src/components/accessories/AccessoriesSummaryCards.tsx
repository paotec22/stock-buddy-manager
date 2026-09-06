import { Card, CardContent } from "@/components/ui/card";
import { AccessoryItem } from "@/types/accessories";
import { Wrench, PackageCheck, AlertTriangle, HelpCircle, Layers } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface AccessoriesSummaryCardsProps {
  items: AccessoryItem[];
  selectedLocation: string;
  onFilterUnpriced?: () => void;
  onFilterLowStock?: () => void;
  activeFilter?: string | null;
}

export function AccessoriesSummaryCards({
  items,
  selectedLocation,
  onFilterUnpriced,
  onFilterLowStock,
  activeFilter,
}: AccessoriesSummaryCardsProps) {
  const totalParts = items.length;
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  
  // Unpriced items (price is null, 0, or undefined)
  const unpricedItems = items.filter((item) => item.price === null || item.price === undefined || Number(item.price) <= 0);
  const pricedItems = items.filter((item) => item.price !== null && item.price !== undefined && Number(item.price) > 0);
  
  // Estimated value for priced items only
  const totalEstimatedValue = pricedItems.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  // Low stock items (< 5 units)
  const lowStockItems = items.filter((item) => (Number(item.quantity) || 0) > 0 && (Number(item.quantity) || 0) < 5);
  const outOfStockItems = items.filter((item) => (Number(item.quantity) || 0) === 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {/* Total Unique Parts */}
      <Card className="border border-border/80 bg-card shadow-xs rounded-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Spare Part Types
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalParts}
            </span>
            <span className="text-xs text-muted-foreground">SKUs</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {selectedLocation === "All Locations" ? "Across all branches" : `In ${selectedLocation} branch`}
          </p>
        </CardContent>
      </Card>

      {/* Total Physical Stock Units */}
      <Card className="border border-border/80 bg-card shadow-xs rounded-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Units in Stock
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {totalUnits}
            </span>
            <span className="text-xs text-muted-foreground">available units</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {outOfStockItems.length > 0 ? `${outOfStockItems.length} out of stock` : "All parts have stock"}
          </p>
        </CardContent>
      </Card>

      {/* Unpriced Spare Parts - Highlights User Requirement */}
      <Card 
        onClick={onFilterUnpriced}
        className={`border shadow-xs rounded-xl transition-all cursor-pointer hover:border-amber-400/80 ${
          activeFilter === "unpriced" 
            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500" 
            : "border-border/80 bg-card"
        }`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              Unpriced Spares
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
              {unpricedItems.length}
            </span>
            <span className="text-xs text-muted-foreground">items</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/90 truncate">
            Variable or supplied on quote
          </p>
        </CardContent>
      </Card>

      {/* Low Stock Reorder Alert */}
      <Card 
        onClick={onFilterLowStock}
        className={`border shadow-xs rounded-xl transition-all cursor-pointer hover:border-rose-400/80 ${
          activeFilter === "low_stock" 
            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500" 
            : "border-border/80 bg-card"
        }`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              {lowStockItems.length + outOfStockItems.length}
            </span>
            <span className="text-xs text-muted-foreground">need restock</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/90 dark:text-rose-400/90 truncate">
            Fewer than 5 units left
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
