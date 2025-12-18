import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SalesEmptyStateProps {
  hasFilters?: boolean;
  onAddSale?: () => void;
}

export function SalesEmptyState({ hasFilters = false, onAddSale }: SalesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters ? "No sales found" : "No sales recorded yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {hasFilters 
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Start by recording your first sale to see your sales data here."
        }
      </p>
      {!hasFilters && onAddSale && (
        <Button onClick={onAddSale} className="btn-with-icon">
          <Plus className="h-4 w-4 mr-1" />
          Record First Sale
        </Button>
      )}
    </div>
  );
}
