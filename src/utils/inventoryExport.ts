import { supabase } from "@/lib/supabase";
import { InventoryItem } from "./inventoryUtils";

export interface ExportDateRange {
  from?: Date;
  to?: Date;
}

/**
 * Export inventory with the exact quantity each item had as of the end of the
 * selected period. Quantity history is reconstructed from `activity_logs`
 * (the inventory logger records the new quantity after every INSERT/UPDATE).
 *
 * - `to` (required for snapshot): quantity is taken from the most recent log
 *   entry on or before this date. If no log exists on/before `to`, the item is
 *   skipped (it didn't exist yet).
 * - `from` (optional): only includes items first added on or after this date.
 */
export async function exportInventoryReport(
  items: InventoryItem[],
  location: string,
  range: ExportDateRange = {}
) {
  const toDate = range.to ?? new Date();
  // include the entire "to" day
  const toCutoff = new Date(toDate);
  toCutoff.setHours(23, 59, 59, 999);
  const fromCutoff = range.from ? new Date(range.from) : undefined;
  if (fromCutoff) fromCutoff.setHours(0, 0, 0, 0);

  // Fetch all inventory activity logs up to the "to" date
  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("item_description, location, created_at, action_type, quantity")
    .eq("table_name", "inventory list")
    .lte("created_at", toCutoff.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Per (description|location): track first INSERT date and last known quantity at/before toDate
  const firstAdded = new Map<string, string>();
  const lastQty = new Map<string, number>();

  (logs || []).forEach((l: any) => {
    const key = `${l.item_description}||${l.location}`;
    if (l.action_type === "INSERT" && !firstAdded.has(key)) {
      firstAdded.set(key, l.created_at);
    }
    if (l.quantity !== null && l.quantity !== undefined) {
      lastQty.set(key, Number(l.quantity));
    }
  });

  const headers = ["Item Description", "Location", "Quantity (as of period)", "Price", "Total", "Date Added"];
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows: string[] = [];
  let totalValue = 0;
  let exportedCount = 0;

  items.forEach((item) => {
    const key = `${item["Item Description"]}||${item.location}`;
    const addedRaw = firstAdded.get(key);
    if (!addedRaw) return; // never existed in the period window

    const addedDate = new Date(addedRaw);
    if (addedDate > toCutoff) return;
    if (fromCutoff && addedDate < fromCutoff) return;

    const qty = lastQty.has(key) ? lastQty.get(key)! : Number(item.Quantity ?? 0);
    const price = Number(item.Price ?? 0);
    const total = qty * price;
    totalValue += total;
    exportedCount += 1;

    rows.push(
      [
        item["Item Description"],
        item.location,
        qty,
        price,
        total,
        addedDate.toLocaleDateString(),
      ].map(escape).join(",")
    );
  });

  const fmt = (d?: Date) => (d ? d.toLocaleDateString() : "—");
  const generated = new Date().toLocaleString();

  const csv = [
    `Inventory Stock Report`,
    `Location:,${escape(location)}`,
    `Period From:,${escape(fmt(range.from))}`,
    `Period To:,${escape(fmt(toDate))}`,
    `Generated:,${escape(generated)}`,
    `Total Items:,${exportedCount}`,
    `Total Value:,${totalValue}`,
    ``,
    headers.join(","),
    ...rows,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = `${range.from ? fmt(range.from).replace(/\//g, "-") + "_to_" : ""}${fmt(toDate).replace(/\//g, "-")}`;
  a.download = `inventory-report-${location}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return exportedCount;
}
