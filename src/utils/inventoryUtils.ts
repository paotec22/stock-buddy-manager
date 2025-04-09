
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
  // Validate inputs
  if (!item["Item Description"] || item["Item Description"].trim() === "") {
    throw new Error("Item description is required");
  }
  
  if (isNaN(item.Price) || item.Price < 0) {
    throw new Error("Price must be a positive number");
  }
  
  if (isNaN(item.Quantity) || item.Quantity < 0 || !Number.isInteger(item.Quantity)) {
    throw new Error("Quantity must be a positive whole number");
  }

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
  
  // Validate that we have at least a header row and one data row
  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one data row");
  }
  
  const items: NewInventoryItem[] = lines
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = line.split(',');
      
      if (values.length < 3) {
        throw new Error("Each line must contain at least item description, price, and quantity");
      }
      
      const itemDescription = values[0]?.trim() || '';
      const priceStr = values[1]?.trim() || '0';
      const quantityStr = values[2]?.trim() || '0';
      
      if (itemDescription === '') {
        throw new Error("Item description cannot be empty");
      }
      
      const price = parseFloat(priceStr);
      const quantity = parseInt(quantityStr);
      
      if (isNaN(price)) {
        throw new Error(`Invalid price for item: ${itemDescription}`);
      }
      
      if (isNaN(quantity) || !Number.isInteger(quantity)) {
        throw new Error(`Invalid quantity for item: ${itemDescription}`);
      }
      
      if (price < 0) {
        throw new Error(`Price cannot be negative for item: ${itemDescription}`);
      }
      
      if (quantity < 0) {
        throw new Error(`Quantity cannot be negative for item: ${itemDescription}`);
      }
      
      return {
        "Item Description": itemDescription,
        Price: price,
        Quantity: quantity,
        Total: price * quantity, // Calculate Total correctly
        location: selectedLocation
      };
    });
  
  return items;
};
