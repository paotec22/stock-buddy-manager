
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface InventoryItem {
  id: number;
  "Item Description": string;
  Price: number;
  Quantity: number;
  Total: number;
  location: string;
}

// Separate interface for adding new items where ID is optional
export interface NewInventoryItem {
  "Item Description": string;
  Price: number;
  Quantity: number;
  Total: number;
  location: string;
}

export const checkExistingItem = async (itemDescription: string, location: string) => {
  const { data: existingItem } = await supabase
    .from('inventory list')
    .select('id')
    .eq('Item Description', itemDescription)
    .eq('location', location)
    .single();
  
  return existingItem;
};

export const addInventoryItem = async (item: NewInventoryItem) => {
  // Ensure Total is calculated correctly
  const validatedItem = {
    ...item,
    Total: item.Price * item.Quantity
  };

  const { error } = await supabase
    .from('inventory list')
    .insert([validatedItem]);

  if (error) {
    console.error('Error adding inventory item:', error);
    if (error.code === '23505') {
      throw new Error("This item already exists in the selected location");
    }
    throw new Error("Failed to add inventory item");
  }
};

export const parseCSVData = (text: string, selectedLocation: string): NewInventoryItem[] => {
  const lines = text.split('\n');
  const items: NewInventoryItem[] = lines
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = line.split(',');
      const price = parseFloat(values[1]?.trim() || '0');
      const quantity = parseInt(values[2]?.trim() || '0');
      return {
        "Item Description": values[0]?.trim() || '',
        Price: price,
        Quantity: quantity,
        Total: price * quantity, // Calculate Total correctly
        location: selectedLocation
      };
    });
  return items;
};
