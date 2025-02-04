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
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Grand Total for {selectedLocation}</h3>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(calculateGrandTotal())}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}