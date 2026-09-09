import { NavLink } from "react-router-dom";
import { Package, Wrench, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventorySubNavProps {
  activeTab: "inventory" | "accessories";
  className?: string;
}

export function InventorySubNav({ activeTab, className }: InventorySubNavProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60", className)}>
      <div className="flex items-center w-full sm:w-auto">
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/70 shadow-xs w-full sm:w-auto">
          <NavLink
            to="/inventory"
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation",
              activeTab === "inventory"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span className="sm:hidden">Inventory</span>
            <span className="hidden sm:inline">Main Inventory</span>
          </NavLink>

          <NavLink
            to="/inventory/accessories"
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation",
              activeTab === "accessories"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
            <span className="sm:hidden">Accessories</span>
            <span className="hidden sm:inline">Accessories & Spare Parts</span>
            <span className="hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
              Spares
            </span>
          </NavLink>
        </div>
      </div>

      <div className="hidden sm:flex items-center text-xs text-muted-foreground gap-1.5">
        <span className="font-medium text-foreground">
          {activeTab === "inventory" ? "Standard Products" : "Spare Parts & Components"}
        </span>
        <span>•</span>
        <span>
          {activeTab === "inventory"
            ? "Fixed price catalog items & inventory valuation"
            : "Components and maintenance spares (price optional)"}
        </span>
      </div>
    </div>
  );
}
