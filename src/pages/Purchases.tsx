import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Building,
  Package,
  FileSpreadsheet,
  PieChart,
  Boxes,
  Truck,
  ArrowUpRight,
  Filter,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { getSecureItem, setSecureItem } from "@/utils/secureStorage";

export interface StockPurchaseRecord {
  id: string;
  vendor_name: string;
  item_name: string;
  inventory_id?: number | null;
  unit_cost_price: number;
  quantity: number;
  total_cost: number;
  retail_price: number;
  payment_account: string;
  invoice_ref: string;
  location: string;
  purchase_date: string;
  created_at: string;
}

const STORAGE_KEY_PURCHASES = "si_manager_stock_purchases";

const DEFAULT_PURCHASES: StockPurchaseRecord[] = [
  {
    id: "pur_1",
    vendor_name: "Lagos Solar Wholesalers Ltd",
    item_name: "5KVA Lithium Battery Inverter",
    inventory_id: 1,
    unit_cost_price: 320000,
    quantity: 10,
    total_cost: 3200000,
    retail_price: 450000,
    payment_account: "FirstBank Main Business",
    invoice_ref: "LSW-2026-091",
    location: "Ikeja",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
    created_at: new Date().toISOString(),
  },
  {
    id: "pur_2",
    vendor_name: "Apex Electronics Imports",
    item_name: "Smart 55-inch OLED TV",
    inventory_id: 2,
    unit_cost_price: 210000,
    quantity: 5,
    total_cost: 1050000,
    retail_price: 290000,
    payment_account: "GTBank Sales & POS",
    invoice_ref: "APX-8812",
    location: "Cement",
    purchase_date: format(new Date(Date.now() - 86400000 * 3), "yyyy-MM-dd"),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "pur_3",
    vendor_name: "Lagos Solar Wholesalers Ltd",
    item_name: "300W Monocrystalline Solar Panels",
    inventory_id: 3,
    unit_cost_price: 45000,
    quantity: 30,
    total_cost: 1350000,
    retail_price: 65000,
    payment_account: "FirstBank Main Business",
    invoice_ref: "LSW-2026-044",
    location: "Ikeja",
    purchase_date: format(new Date(Date.now() - 86400000 * 7), "yyyy-MM-dd"),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export default function Purchases() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history");

  // New Purchase Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [itemName, setItemName] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [unitCost, setUnitCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [retailPrice, setRetailPrice] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("FirstBank Main Business");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [location, setLocation] = useState("Ikeja");
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // 1. Fetch Inventory for item picker
  const { data: inventoryList = [] } = useQuery({
    queryKey: ["inventoryForPurchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select(`id, "Item Description", Price, location`)
        .order("Item Description", { ascending: true });

      if (error) {
        console.error("Error fetching inventory for purchases:", error);
        return [];
      }
      return data || [];
    },
  });

  // 2. Fetch Purchases
  const { data: purchases = DEFAULT_PURCHASES } = useQuery<StockPurchaseRecord[]>({
    queryKey: ["stockPurchases"],
    queryFn: async () => {
      return getSecureItem<StockPurchaseRecord[]>(STORAGE_KEY_PURCHASES, DEFAULT_PURCHASES);
    },
  });

  // Unique vendors list
  const vendorsList = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => set.add(p.vendor_name));
    return Array.from(set);
  }, [purchases]);

  // Aggregate Metrics
  const totalPurchaseSpend = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.total_cost, 0);
  }, [purchases]);

  const totalItemsProcured = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.quantity, 0);
  }, [purchases]);

  const averageGrossMarginPct = useMemo(() => {
    if (purchases.length === 0) return 0;
    const margins = purchases.map((p) => {
      if (!p.retail_price || p.retail_price === 0) return 0;
      return ((p.retail_price - p.unit_cost_price) / p.retail_price) * 100;
    });
    const sum = margins.reduce((a, b) => a + b, 0);
    return Math.round(sum / purchases.length);
  }, [purchases]);

  // Vendor Spend Breakdown
  const vendorSpendLeaderboard = useMemo(() => {
    const map: Record<string, { totalSpend: number; count: number; itemsCount: number }> = {};
    purchases.forEach((p) => {
      if (!map[p.vendor_name]) {
        map[p.vendor_name] = { totalSpend: 0, count: 0, itemsCount: 0 };
      }
      map[p.vendor_name].totalSpend += p.total_cost;
      map[p.vendor_name].count += 1;
      map[p.vendor_name].itemsCount += p.quantity;
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [purchases]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoice_ref.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === "all" || p.location === selectedLocation;
      const matchesVendor = selectedVendorFilter === "all" || p.vendor_name === selectedVendorFilter;
      return matchesSearch && matchesLocation && matchesVendor;
    });
  }, [purchases, searchQuery, selectedLocation, selectedVendorFilter]);

  // Handle Inventory Selection Change
  const handleInventorySelect = (invIdStr: string) => {
    setSelectedInventoryId(invIdStr);
    const item = inventoryList.find((i: any) => i.id.toString() === invIdStr);
    if (item) {
      setItemName(item["Item Description"]);
      if (item.Price) setRetailPrice(item.Price.toString());
    }
  };

  // Handle Add Purchase
  const handleAddPurchase = async () => {
    if (!vendorName || !itemName || !unitCost || !quantity) {
      toast.error("Please fill in supplier name, item description, cost price and quantity.");
      return;
    }

    const unitCostNum = parseFloat(unitCost);
    const qtyNum = parseInt(quantity, 10);
    const totalCostNum = unitCostNum * qtyNum;
    const retailPriceNum = parseFloat(retailPrice) || 0;

    const newPurchase: StockPurchaseRecord = {
      id: `pur_${Date.now()}`,
      vendor_name: vendorName,
      item_name: itemName,
      inventory_id: selectedInventoryId ? parseInt(selectedInventoryId, 10) : null,
      unit_cost_price: unitCostNum,
      quantity: qtyNum,
      total_cost: totalCostNum,
      retail_price: retailPriceNum,
      payment_account: paymentAccount,
      invoice_ref: invoiceRef || `INV-SUP-${Date.now().toString().slice(-5)}`,
      location: location,
      purchase_date: purchaseDate,
      created_at: new Date().toISOString(),
    };

    const updated = [newPurchase, ...purchases];
    setSecureItem(STORAGE_KEY_PURCHASES, updated);
    queryClient.setQueryData(["stockPurchases"], updated);

    // If an inventory item was selected, option to update actual_purchase_price in sales/inventory
    if (selectedInventoryId) {
      try {
        await supabase
          .from("inventory list")
          .update({
            // Optionally update price or stock if applicable
          })
          .eq("id", parseInt(selectedInventoryId, 10));
      } catch (err) {
        console.error("Error updating stock item:", err);
      }
    }

    toast.success("Stock purchase recorded successfully!");
    setIsPurchaseModalOpen(false);
    setVendorName("");
    setItemName("");
    setSelectedInventoryId("");
    setUnitCost("");
    setQuantity("1");
    setRetailPrice("");
    setInvoiceRef("");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Date", "Vendor / Supplier", "Item Description", "Unit Cost", "Qty", "Total Spend", "Retail Price", "Account", "Invoice Ref", "Location"];
    const rows = filteredPurchases.map((p) => [
      p.purchase_date,
      `"${p.vendor_name.replace(/"/g, '""')}"`,
      `"${p.item_name.replace(/"/g, '""')}"`,
      p.unit_cost_price,
      p.quantity,
      p.total_cost,
      p.retail_price,
      p.payment_account,
      p.invoice_ref,
      p.location,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Purchases_Report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Purchase report exported to CSV!");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Purchase & Procurement Analysis</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Log vendor stock bills, track inventory replenishment costs, analyze supplier spend, and evaluate markup profit margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsPurchaseModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Record Stock Purchase
          </Button>

          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Strategic Advice Banner */}
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                Why Purchase Analysis is Key to Cashflow Control
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By recording exact purchase prices from Lagos Solar Wholesalers, Apex Electronics, and other vendors, you can identify which suppliers offer the best unit costs, track cost inflation over time, and protect your profit margin when setting retail prices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Stock Purchase Spend</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatCurrency(totalPurchaseSpend)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span>Across all recorded supplier orders</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Units Procured & Restocked</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {totalItemsProcured} units
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <Boxes className="h-3.5 w-3.5 text-blue-600" />
            <span>Total physical stock acquired</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Average Retail Markup Margin</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {averageGrossMarginPct}% Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cost vs Retail Selling Price</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Active Suppliers & Vendors</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600">
              {vendorsList.length} Vendors
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-purple-600" />
            <span>Key inventory partners</span>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Spend Leaderboard */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Top Supplier & Vendor Spend Leaderboard
          </CardTitle>
          <CardDescription className="text-xs">
            Analysis of procurement volume and total naira spend by wholesaler / importer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendorSpendLeaderboard.map((v, i) => (
              <div key={v.name} className="p-4 border rounded-xl bg-card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Rank #{i + 1} Supplier
                    </span>
                    <h4 className="font-semibold text-foreground text-sm">{v.name}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {v.count} Orders
                  </Badge>
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{v.itemsCount} units restocked</span>
                  <span className="font-bold text-sm text-primary">{formatCurrency(v.totalSpend)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Log Table & Controls */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">Stock Purchase History & Cost Log</CardTitle>
              <CardDescription className="text-xs">
                Detailed record of stock arrivals, purchase invoices, unit costs, and retail margins.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendor, item, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <Select value={selectedVendorFilter} onValueChange={setSelectedVendorFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendorsList.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Ikeja">Ikeja</SelectItem>
                  <SelectItem value="Cement">Cement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor / Supplier</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Unit Cost Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead className="text-right">Retail Price</TableHead>
                  <TableHead className="text-center">Est. Margin</TableHead>
                  <TableHead>Ref / Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      No stock purchases found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => {
                    const margin =
                      purchase.retail_price > 0
                        ? Math.round(((purchase.retail_price - purchase.unit_cost_price) / purchase.retail_price) * 100)
                        : 0;
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="text-xs whitespace-nowrap font-medium">
                          {purchase.purchase_date}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {purchase.vendor_name}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {purchase.item_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {purchase.location}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-right">
                          {formatCurrency(purchase.unit_cost_price)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-center">
                          {purchase.quantity}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right text-primary whitespace-nowrap">
                          {formatCurrency(purchase.total_cost)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-right text-emerald-600">
                          {purchase.retail_price > 0 ? formatCurrency(purchase.retail_price) : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-600 text-[10px]">
                            {margin}% Gross
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="font-mono text-[11px]">{purchase.invoice_ref}</div>
                          <div className="text-[10px]">{purchase.payment_account}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Stock Purchase / Vendor Bill</DialogTitle>
            <DialogDescription>
              Log inventory acquisitions to update cost price history and procurement spend.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Supplier / Vendor Name</label>
              <Input
                placeholder="e.g. Lagos Solar Wholesalers Ltd"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Select Showroom Item (Optional)</label>
              <Select value={selectedInventoryId} onValueChange={handleInventorySelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose existing inventory item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryList.map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item["Item Description"]} ({item.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Item Description / Name</label>
              <Input
                placeholder="e.g. 5KVA Inverter Battery Pack"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit Cost Price (₦)</label>
                <Input
                  type="number"
                  placeholder="320000"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Qty Purchased</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Retail Price (₦)</label>
                <Input
                  type="number"
                  placeholder="450000"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Calculated Total Spend:</span>
              <span className="font-bold text-sm text-primary">
                {formatCurrency((parseFloat(unitCost) || 0) * (parseInt(quantity, 10) || 0))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Payment Account Used</label>
                <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FirstBank Main Business">FirstBank Main Business</SelectItem>
                    <SelectItem value="GTBank Sales & POS">GTBank Sales & POS</SelectItem>
                    <SelectItem value="Showroom Cash Till">Showroom Cash Till</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ikeja">Ikeja</SelectItem>
                    <SelectItem value="Cement">Cement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Supplier Invoice / Receipt No.</label>
                <Input
                  placeholder="e.g. LSW-2026-091"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchase Date</label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPurchase}>Save Stock Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
