import { InventoryItem } from "@/utils/inventoryUtils";

export type SortKey =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "qty_asc"
  | "qty_desc";

export type ViewMode = "grid" | "compact" | "list";

export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export interface StockStatus {
  label: string;
  badgeColor: string;
  dotColor: string;
  textColor: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export function getStockStatus(qty: number): StockStatus {
  if (qty <= 0) {
    return {
      label: "Out of Stock",
      badgeColor: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
      dotColor: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      status: "out_of_stock",
    };
  }
  if (qty <= 10) {
    return {
      label: `Low Stock (${qty})`,
      badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
      dotColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      status: "low_stock",
    };
  }
  return {
    label: "In Stock",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    status: "in_stock",
  };
}
