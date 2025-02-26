
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  totals: {
    subtotal: number;
    total: number;
  };
}

export const InvoiceItemsTable = ({ items, setItems, totals }: InvoiceItemsTableProps) => {
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 0,
    unit_price: 0,
    amount: 0
  });

  // Update the amount whenever quantity or unit_price changes
  useEffect(() => {
    const amount = newItem.quantity * newItem.unit_price;
    setNewItem(prev => ({ ...prev, amount }));
  }, [newItem.quantity, newItem.unit_price]);

  // Add new item to the list when fields are filled
  useEffect(() => {
    // Only automatically add when all required fields have values
    if (newItem.description && newItem.quantity > 0 && newItem.unit_price > 0) {
      const tempItem = { ...newItem };
      
      // Update the list of items with the current values
      setItems(prevItems => {
        // Check if we already have a temporary item (the last one without full values)
        const hasTemp = prevItems.length > 0 && 
                       !prevItems[prevItems.length - 1].description;
        
        if (hasTemp) {
          // Replace the temporary item
          const newItems = [...prevItems];
          newItems[newItems.length - 1] = tempItem;
          return newItems;
        } else {
          // Add as a new item
          return [...prevItems, tempItem];
        }
      });
    }
  }, [newItem.description, newItem.quantity, newItem.unit_price, setItems]);

  const handleAddItem = () => {
    // Clear the inputs to add a new item
    setNewItem({
      description: "",
      quantity: 0,
      unit_price: 0,
      amount: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const handleInputChange = (field: keyof InvoiceItem, value: string | number) => {
    let processedValue = value;
    
    // Convert string numbers to actual numbers
    if (field === 'quantity' || field === 'unit_price') {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setNewItem(prev => ({ 
      ...prev, 
      [field]: processedValue 
    }));
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="w-[100px] print:hidden">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="break-words">{item.description}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
              <TableCell>{formatCurrency(item.amount)}</TableCell>
              <TableCell className="print:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="print:hidden">
            <TableCell>
              <Input
                placeholder="Item description"
                value={newItem.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                value={newItem.quantity || ""}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="w-full"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="0"
                value={newItem.unit_price || ""}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                className="w-full"
              />
            </TableCell>
            <TableCell>{formatCurrency(newItem.amount)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 items-end">
        <div className="flex justify-between w-full md:w-64 font-bold">
          <span>Total:</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>
    </div>
  );
};
