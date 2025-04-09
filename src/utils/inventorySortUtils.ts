
import { InventoryItem } from "@/utils/inventoryUtils";

export function getSortedInventoryItems(inventoryItems: InventoryItem[], sortBy: string) {
  if (!inventoryItems) return [];
  
  // Ensure all items have correct Total values
  const validatedItems = inventoryItems.map(item => ({
    ...item,
    // Ensure Quantity is a number
    Quantity: typeof item.Quantity === 'number' ? item.Quantity : 0,
    // Ensure Price is a number
    Price: typeof item.Price === 'number' ? item.Price : 0,
    // Recalculate Total to ensure consistency
    Total: (typeof item.Price === 'number' && typeof item.Quantity === 'number') 
      ? item.Price * item.Quantity 
      : 0
  }));
  
  const items = [...validatedItems];
  switch (sortBy) {
    case "name_asc":
      return items.sort((a, b) => a["Item Description"].localeCompare(b["Item Description"]));
    case "name_desc":
      return items.sort((a, b) => b["Item Description"].localeCompare(a["Item Description"]));
    case "price_asc":
      return items.sort((a, b) => a.Price - b.Price);
    case "price_desc":
      return items.sort((a, b) => b.Price - a.Price);
    case "quantity_asc":
      return items.sort((a, b) => a.Quantity - b.Quantity);
    case "quantity_desc":
      return items.sort((a, b) => b.Quantity - a.Quantity);
    default:
      return items;
  }
}
