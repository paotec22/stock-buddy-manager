import { supabase } from "@/lib/supabase";
import { InventoryItem } from "./inventoryUtils";

export type InventoryExportMode = "snapshot" | "added";

export interface ExportDateRange {
  from?: Date;
  to?: Date;
  mode?: InventoryExportMode;
}

/**
 * Export inventory in one of two modes:
 *
 * - "snapshot" (default): exports each item with the exact quantity it had as
 *   of the end of the "to" date, reconstructed from `activity_logs`.
 * - "added": exports only items that were added (INSERT) during the period
 *   [from, to], showing the quantity that was added in that window.
 */
export async function exportInventoryReport(
  items: InventoryItem[],
  location: string,
  range: ExportDateRange = {}
) {
  const mode: InventoryExportMode = range.mode ?? "snapshot";
  const toDate = range.to ?? new Date();
  const toCutoff = new Date(toDate);
  toCutoff.setHours(23, 59, 59, 999);
  const fromCutoff = range.from ? new Date(range.from) : undefined;
  if (fromCutoff) fromCutoff.setHours(0, 0, 0, 0);

  // For "snapshot" we need all logs up to toCutoff to reconstruct quantity.
  // For "added" we need INSERT logs within [from, to] (and any earlier INSERT
  // to determine the "first added" date).
  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select("item_description, location, created_at, action_type, quantity")
    .eq("table_name", "inventory list")
    .lte("created_at", toCutoff.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const fmt = (d?: Date) => (d ? d.toLocaleDateString() : "—");
  const generated = new Date().toLocaleString();

  let headers: string[] = [];
  const rows: string[] = [];
  let totalValue = 0;
  let exportedCount = 0;

  if (mode === "snapshot") {
    // Reconstruct first-added date + last-known quantity at/before toCutoff
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

    headers = ["Item Description", "Location", "Quantity (as of period)", "Price", "Total", "Date Added"];

    items.forEach((item) => {
      const key = `${item["Item Description"]}||${item.location}`;
      const addedRaw = firstAdded.get(key);
      if (!addedRaw) return;

      const addedDate = new Date(addedRaw);
      if (addedDate > toCutoff) return;
      if (fromCutoff && addedDate < fromCutoff) return;

      const qty = lastQty.has(key) ? lastQty.get(key)! : Number(item.Quantity ?? 0);
      const price = Number(item.Price ?? 0);
      const total = qty * price;
      totalValue += total;
      exportedCount += 1;

      rows.push(
        [item["Item Description"], item.location, qty, price, total, addedDate.toLocaleDateString()]
          .map(escape)
          .join(",")
      );
    });
  } else {
    // "added" mode: include INSERT events within [from, to]
    headers = ["Item Description", "Location", "Quantity Added", "Price", "Total", "Date Added"];

    // Price lookup from current inventory
    const priceLookup = new Map<string, number>();
    items.forEach((item) => {
      priceLookup.set(`${item["Item Description"]}||${item.location}`, Number(item.Price ?? 0));
    });

    (logs || []).forEach((l: any) => {
      if (l.action_type !== "INSERT") return;
      const addedDate = new Date(l.created_at);
      if (fromCutoff && addedDate < fromCutoff) return;
      if (addedDate > toCutoff) return;

      const key = `${l.item_description}||${l.location}`;
      const qty = Number(l.quantity ?? 0);
      const price = priceLookup.get(key) ?? 0;
      const total = qty * price;
      totalValue += total;
      exportedCount += 1;

      rows.push(
        [l.item_description, l.location, qty, price, total, addedDate.toLocaleDateString()]
          .map(escape)
          .join(",")
      );
    });
  }

  const title =
    mode === "snapshot" ? "Inventory Stock Report (Snapshot)" : "Inventory Added Report";

  const csv = [
    title,
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
  const prefix = mode === "snapshot" ? "inventory-snapshot" : "inventory-added";
  a.download = `${prefix}-${location}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return exportedCount;
}
