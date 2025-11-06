import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus } from "@/components/ui/status-badge";
import { Package, TrendingUp, AlertTriangle } from "lucide-react";

interface InventoryGrandTotalProps {
  items: InventoryItem[];
  selectedLocation: string;
}

export function InventoryGrandTotal({ items, selectedLocation }: InventoryGrandTotalProps) {
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      // Use the stored Total field if available, otherwise calculate it
      const itemTotal = item.Total ?? (item.Price * item.Quantity);
      return sum + itemTotal;
    }, 0);
  };

  const calculateStatusCounts = () => {
    const counts = {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0
    };

    items.forEach(item => {
      const status = getStockStatus(item.Quantity || 0);
      if (status === "in-stock") counts.inStock++;
      else if (status === "low-stock") counts.lowStock++;
      else if (status === "out-of-stock") counts.outOfStock++;
    });

    return counts;
  };

  if (items.length === 0) return null;

  const statusCounts = calculateStatusCounts();
  const totalItems = items.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {/* Total Value Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Inventory Value</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(calculateGrandTotal())}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedLocation} • {totalItems} items
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary Card */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Stock Status Summary</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center space-y-1">
                <StatusBadge status="in-stock" size="sm" showIcon={false} />
                <p className="text-2xl font-bold text-success">{statusCounts.inStock}</p>
              </div>
              <div className="text-center space-y-1">
                <StatusBadge status="low-stock" size="sm" showIcon={false} />
                <p className="text-2xl font-bold text-warning">{statusCounts.lowStock}</p>
              </div>
              <div className="text-center space-y-1">
                <StatusBadge status="out-of-stock" size="sm" showIcon={false} />
                <p className="text-2xl font-bold text-destructive">{statusCounts.outOfStock}</p>
              </div>
            </div>

            {statusCounts.lowStock > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mt-3">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning">
                  {statusCounts.lowStock} item{statusCounts.lowStock > 1 ? 's' : ''} running low on stock
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
