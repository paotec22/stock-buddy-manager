import { supabase } from "@/lib/supabase";
import { InventoryItem } from "./inventoryUtils";

export type InventoryExportMode = "snapshot" | "added";

export interface ExportDateRange {
  from?: Date;
  to?: Date;
  mode?: InventoryExportMode;
}

// Supabase caps responses at 1000 rows by default — paginate to get everything.
async function fetchAllInventoryLogs(toCutoffIso: string) {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("item_description, location, created_at, action_type, quantity")
      .eq("table_name", "inventory list")
      .lte("created_at", toCutoffIso)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/**
 * Export inventory in one of two modes:
 *
 * - "snapshot" (default): exports each item with the exact quantity it had as
 *   of the end of the "to" date, reconstructed from `activity_logs`. If no
 *   log history exists for an item, falls back to its current quantity.
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

  const logs = await fetchAllInventoryLogs(toCutoff.toISOString());

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
    const firstAdded = new Map<string, string>();
    const lastQty = new Map<string, number>();

    logs.forEach((l: any) => {
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
      const addedDate = addedRaw ? new Date(addedRaw) : undefined;

      // If a from-date is set, only include items first added on/after it
      // (items with no recorded INSERT can't be date-filtered, so skip).
      if (fromCutoff) {
        if (!addedDate) return;
        if (addedDate < fromCutoff) return;
        if (addedDate > toCutoff) return;
      }

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
          addedDate ? addedDate.toLocaleDateString() : "—",
        ]
          .map(escape)
          .join(",")
      );
    });
  } else {
    headers = ["Item Description", "Location", "Quantity Added", "Price", "Total", "Date Added"];

    const priceLookup = new Map<string, number>();
    items.forEach((item) => {
      priceLookup.set(`${item["Item Description"]}||${item.location}`, Number(item.Price ?? 0));
    });

    logs.forEach((l: any) => {
      if (l.action_type !== "INSERT") return;
      const addedDate = new Date(l.created_at);
      if (fromCutoff && addedDate < fromCutoff) return;
      if (addedDate > toCutoff) return;
      // Respect location selection if items are filtered to one location
      if (location && l.location && l.location !== location) return;

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
