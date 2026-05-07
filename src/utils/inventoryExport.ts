import { supabase } from "@/lib/supabase";
import { InventoryItem } from "./inventoryUtils";

export async function exportInventoryReport(items: InventoryItem[], location: string) {
  // Fetch INSERT activity logs for inventory to get added dates
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("item_description, location, created_at, action_type, table_name")
    .eq("table_name", "inventory list")
    .eq("action_type", "INSERT")
    .order("created_at", { ascending: true });

  // Map: earliest insert per (description|location)
  const dateMap = new Map<string, string>();
  (logs || []).forEach((l: any) => {
    const key = `${l.item_description}||${l.location}`;
    if (!dateMap.has(key)) dateMap.set(key, l.created_at);
  });

  const headers = ["Item Description", "Location", "Quantity", "Price", "Total", "Date Added"];
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = items.map((item) => {
    const key = `${item["Item Description"]}||${item.location}`;
    const dateRaw = dateMap.get(key);
    const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString() : "N/A";
    return [
      item["Item Description"],
      item.location,
      item.Quantity ?? 0,
      item.Price ?? 0,
      item.Total ?? 0,
      dateStr,
    ].map(escape).join(",");
  });

  const generated = new Date().toLocaleString();
  const totalValue = items.reduce((sum, i) => sum + (Number(i.Total) || 0), 0);

  const csv = [
    `Inventory Stock Report`,
    `Location:,${escape(location)}`,
    `Generated:,${escape(generated)}`,
    `Total Items:,${items.length}`,
    `Total Value:,${totalValue}`,
    ``,
    headers.join(","),
    ...rows,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-report-${location}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
