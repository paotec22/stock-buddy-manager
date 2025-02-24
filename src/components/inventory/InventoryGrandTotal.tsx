import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";

interface InventoryGrandTotalProps {
  items: InventoryItem[];
  selectedLocation: string;
}

export function InventoryGrandTotal({ items, selectedLocation }: InventoryGrandTotalProps) {
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.Total || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (items.length === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/10">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-primary">
            Total Inventory Value ({selectedLocation})
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-primary">
            {formatCurrency(calculateGrandTotal())}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
