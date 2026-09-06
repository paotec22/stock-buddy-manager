import { Package, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SalesEmptyStateProps {
  hasFilters?: boolean;
  onAddSale?: () => void;
  onClearFilters?: () => void;
}

export function SalesEmptyState({ hasFilters = false, onAddSale, onClearFilters }: SalesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-2xl bg-muted/60 border border-border/80 p-4 mb-3 text-muted-foreground">
        <Package className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {hasFilters ? "No matching sales found" : "No sales recorded yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {hasFilters 
          ? "Try adjusting your search term, branch location, or date range."
          : "Start by recording your first sale or uploading bulk sales."
        }
      </p>
      {hasFilters && onClearFilters && (
        <Button onClick={onClearFilters} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All Filters
        </Button>
      )}
      {!hasFilters && onAddSale && (
        <Button onClick={onAddSale} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Record First Sale
        </Button>
      )}
    </div>
  );
}

