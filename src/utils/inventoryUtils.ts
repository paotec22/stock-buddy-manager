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

export const checkExistingItem = async (itemDescription: string, location: string) => {
  const { data: existingItem } = await supabase
    .from('inventory list')
    .select('id')
    .eq('Item Description', itemDescription)
    .eq('location', location)
    .single();
  
  return existingItem;
};

export const addInventoryItem = async (item: InventoryItem) => {
  const { error } = await supabase
    .from('inventory list')
    .insert([item]);

  if (error) {
    console.error('Error adding inventory item:', error);
    if (error.code === '23505') {
      throw new Error("This item already exists in the selected location");
    }
    throw new Error("Failed to add inventory item");
  }
};

export const parseCSVData = (text: string, selectedLocation: string): InventoryItem[] => {
  const lines = text.split('\n');
  const items: InventoryItem[] = lines
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = line.split(',');
      const price = parseFloat(values[1]?.trim() || '0');
      const quantity = parseInt(values[2]?.trim() || '0');
      return {
        id: 0, // This will be replaced by the database
        "Item Description": values[0]?.trim() || '',
        Price: price,
        Quantity: quantity,
        Total: price * quantity,
        location: selectedLocation
      };
    });
  return items;
};