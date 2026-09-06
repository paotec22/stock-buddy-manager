import { NavLink } from "react-router-dom";
import { Package, Wrench, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventorySubNavProps {
  activeTab: "inventory" | "accessories";
  className?: string;
}

export function InventorySubNav({ activeTab, className }: InventorySubNavProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/70 shadow-xs">
          <NavLink
            to="/inventory"
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "inventory"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Package className="h-4 w-4 text-primary" />
            <span>Main Inventory</span>
          </NavLink>

          <NavLink
            to="/inventory/accessories"
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "accessories"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Wrench className="h-4 w-4 text-amber-500" />
            <span>Accessories & Spare Parts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
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
