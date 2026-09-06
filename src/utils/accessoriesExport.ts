import { AccessoryItem } from "@/types/accessories";

export function exportAccessoriesToCSV(items: AccessoryItem[], location: string = "All Locations") {
  const headers = [
    "Part Name",
    "Part Number / SKU",
    "Category",
    "Compatible Equipment",
    "Stock Quantity",
    "Unit",
    "Price (NGN)",
    "Price Status",
    "Estimated Valuation (NGN)",
    "Condition",
    "Location",
    "Notes",
    "Date Added",
  ];

  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = items.map((item) => {
    const hasPrice = item.price !== null && item.price !== undefined && Number(item.price) > 0;
    const priceVal = hasPrice ? Number(item.price) : "";
    const priceStatus = hasPrice ? "Priced" : "No specific price";
    const valuation = hasPrice ? Number(item.price) * Number(item.quantity) : "";

    return [
      escape(item.name),
      escape(item.part_number || ""),
      escape(item.category || ""),
      escape(item.compatible_with || ""),
      escape(item.quantity ?? 0),
      escape(item.unit || "pcs"),
      escape(priceVal),
      escape(priceStatus),
      escape(valuation),
      escape(item.condition || "New"),
      escape(item.location || ""),
      escape(item.notes || ""),
      escape(item.created_at ? new Date(item.created_at).toLocaleDateString() : ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanLocation = location.toLowerCase().replace(/\s+/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `accessories_spare_parts_${cleanLocation}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
