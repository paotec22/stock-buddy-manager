import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";

interface SalesPriceCellProps {
  price: number;
  isAdmin: boolean;
  formatCurrency: (amount: number) => string;
  onPriceUpdate: (newPrice: number) => void;
}

export function SalesPriceCell({ price, isAdmin, formatCurrency, onPriceUpdate }: SalesPriceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(price.toString());

  const handleSave = () => {
    const newPrice = parseFloat(editValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceUpdate(newPrice);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(price.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdmin) {
    return <span>{formatCurrency(price)}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-24 h-8"
          autoFocus
          step="0.01"
          min="0"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{formatCurrency(price)}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3 text-gray-500" />
      </Button>
    </div>
  );
}