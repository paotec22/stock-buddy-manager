import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  List,
  Download,
  Receipt,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CustomerStats {
  total_orders: number;
  total_invoices: number;
  total_spent: number;
  total_paid: number;
  outstanding: number;
  last_activity?: string;
}

export interface CustomerInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  customer_name: string;
}

const emptyForm = {
  id: "" as string | null,
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function Customers() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "debt" | "high_value" | "recent">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

  // 1. Fetch Customers Directory
  const {
    data: customers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
      return (data ?? []) as Customer[];
    },
    enabled: !!session,
  });

  // 2. Fetch Sales Statistics by Customer
  const { data: salesStats = {} } = useQuery({
    queryKey: ["customers", "sales-aggregates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, customer_id, total_amount, amount_paid, payment_status, sale_date")
        .not("customer_id", "is", null);
      if (error) {
        console.warn("Sales query for customers:", error);
        return {};
      }
      const map: Record<string, { orders: number; spent: number; paid: number; outstanding: number; lastDate: string }> = {};
      (data ?? []).forEach((s: any) => {
        const id = s.customer_id as string;
        if (!map[id]) {
          map[id] = { orders: 0, spent: 0, paid: 0, outstanding: 0, lastDate: s.sale_date };
        }
        map[id].orders += 1;
        map[id].spent += Number(s.total_amount) || 0;
        map[id].paid += Number(s.amount_paid) || 0;
        map[id].outstanding = Math.max(0, map[id].spent - map[id].paid);
        if (s.sale_date && s.sale_date > map[id].lastDate) {
          map[id].lastDate = s.sale_date;
        }
      });
      return map;
    },
    enabled: !!session,
  });

  // 3. Fetch Invoices by Customer
  const { data: invoicesData = [] } = useQuery({
    queryKey: ["customers", "invoices-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, customer_id, customer_name, customer_phone, customer_email, customer_address, total_amount, invoice_number, invoice_date, due_date")
        .order("invoice_date", { ascending: false });
      if (error) {
        console.warn("Invoices query for customers:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!session,
  });

  // Map Invoices to Customer IDs or Names
  const invoicesByCustomer = useMemo(() => {
    const map: Record<string, CustomerInvoice[]> = {};
    invoicesData.forEach((inv: any) => {
      const custId = inv.customer_id;
      const custName = (inv.customer_name || "").trim().toLowerCase();
      if (custId) {
        if (!map[custId]) map[custId] = [];
        map[custId].push(inv);
      }
      if (custName) {
        if (!map[custName]) map[custName] = [];
        map[custName].push(inv);
      }
    });
    return map;
  }, [invoicesData]);

  // Combined Customer Stats
  const customerStatsMap = useMemo(() => {
    const map: Record<string, CustomerStats> = {};
    customers.forEach((c) => {
      const s = salesStats[c.id];
      const invs = invoicesByCustomer[c.id] || invoicesByCustomer[c.name.trim().toLowerCase()] || [];
      const invoiceSpent = invs.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const totalSpent = (s?.spent || 0) + (s ? 0 : invoiceSpent);
      const totalPaid = s?.paid || 0;
      const outstanding = s ? s.outstanding : 0;

      map[c.id] = {
        total_orders: s?.orders || 0,
        total_invoices: invs.length,
        total_spent: totalSpent,
        total_paid: totalPaid,
        outstanding: outstanding,
        last_activity: s?.lastDate || invs[0]?.invoice_date || c.created_at,
      };
    });
    return map;
  }, [customers, salesStats, invoicesByCustomer]);

  // Fetch Selected Customer History
  const { data: selectedSales = [], isLoading: selectedSalesLoading } = useQuery({
    queryKey: ["customers", "history", selected?.id],
    queryFn: async () => {
      if (!selected?.id) return [];
      const { data, error } = await supabase
        .from("sales")
        .select(`id, sale_date, quantity, sale_price, total_amount, amount_paid, payment_status, "inventory list" ( "Item Description" )`)
        .eq("customer_id", selected.id)
        .order("sale_date", { ascending: false })
        .limit(50);
      if (error) {
        console.warn("Selected sales fetch error:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!selected?.id,
  });

  const selectedInvoices = useMemo(() => {
    if (!selected) return [];
    return invoicesByCustomer[selected.id] || invoicesByCustomer[selected.name.trim().toLowerCase()] || [];
  }, [selected, invoicesByCustomer]);

  // Sync / Import past invoice clients into customers table
  const handleSyncFromInvoices = async () => {
    setSyncing(true);
    try {
      let importedCount = 0;
      const existingNames = new Set(customers.map((c) => c.name.trim().toLowerCase()));

      for (const inv of invoicesData) {
        const name = (inv.customer_name || "").trim();
        if (name && !existingNames.has(name.toLowerCase())) {
          existingNames.add(name.toLowerCase());
          const { data: newCust, error } = await supabase
            .from("customers")
            .insert({
              name,
              phone: inv.customer_phone?.trim() || null,
              email: inv.customer_email?.trim() || null,
              address: inv.customer_address?.trim() || null,
              notes: `Imported from Invoice #${inv.invoice_number || ""}`,
              created_by: session?.user?.id ?? null,
            })
            .select("id")
            .maybeSingle();

          if (!error && newCust) {
            importedCount++;
            // Link back to invoice
            await supabase.from("invoices").update({ customer_id: newCust.id }).eq("id", inv.id);
          }
        }
      }

      if (importedCount > 0) {
        toast.success(`Successfully synced ${importedCount} client(s) from past invoices.`);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.info("All invoice clients are already synchronized in your directory.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to sync customers");
    } finally {
      setSyncing(false);
    }
  };

  // Seed Starter Sample Clients
  const handleSeedSampleClients = async () => {
    setSyncing(true);
    try {
      const sampleClients = [
        {
          name: "Smart Residential Client — Lekki Phase 1",
          phone: "+234 803 123 4567",
          email: "client.lekki@example.com",
          address: "Admiralty Way, Lekki Phase 1, Lagos",
          notes: "Motorized curtains & smart touch switch integration for entire penthouse.",
        },
        {
          name: "Atlantic Horizon Hotels & Suites",
          phone: "+234 812 987 6543",
          email: "procurement@atlantichorizon.ng",
          address: "Victoria Island Commercial District, Lagos",
          notes: "Commercial motorized tracks and smart room automation project.",
        },
        {
          name: "Showroom Walk-in Retail Customer",
          phone: "+234 705 555 1122",
          email: "retail.shopper@gmail.com",
          address: "Ikeja GRA, Lagos",
          notes: "Zigbee smart hub and motorized blind accessories inquiry.",
        },
      ];

      for (const client of sampleClients) {
        await supabase.from("customers").insert({
          ...client,
          created_by: session?.user?.id ?? null,
        });
      }

      toast.success("Added starter client profiles to your directory.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to add sample clients");
    } finally {
      setSyncing(false);
    }
  };

  // Filtering & Search
  const filtered = useMemo(() => {
    let list = customers;

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.address ?? "").toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
      );
    }

    // Active filter tabs
    if (activeFilter === "debt") {
      list = list.filter((c) => (customerStatsMap[c.id]?.outstanding || 0) > 0);
    } else if (activeFilter === "high_value") {
      list = list.filter((c) => (customerStatsMap[c.id]?.total_spent || 0) >= 100000);
    } else if (activeFilter === "recent") {
      list = list.slice().sort((a, b) => {
        const dateA = new Date(customerStatsMap[a.id]?.last_activity || a.created_at).getTime();
        const dateB = new Date(customerStatsMap[b.id]?.last_activity || b.created_at).getTime();
        return dateB - dateA;
      });
    }

    return list;
  }, [customers, search, activeFilter, customerStatsMap]);

  // Aggregate Metrics
  const totalStats = useMemo(() => {
    let totalRevenue = 0;
    let totalOutstanding = 0;
    let withOrdersCount = 0;

    customers.forEach((c) => {
      const s = customerStatsMap[c.id];
      if (s) {
        totalRevenue += s.total_spent || 0;
        totalOutstanding += s.outstanding || 0;
        if (s.total_orders > 0 || s.total_invoices > 0) withOrdersCount++;
      }
    });

    return {
      totalCustomers: customers.length,
      withOrdersCount,
      totalRevenue,
      totalOutstanding,
    };
  }, [customers, customerStatsMap]);

  const openAdd = () => {
    setForm({ ...emptyForm, id: null });
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      id: c.id,
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Customer name is required");
      return;
    }
    if (name.length > 100) {
      toast.error("Customer name is too long");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (form.id) {
        const { error } = await supabase.from("customers").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Customer record updated");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, created_by: session?.user?.id ?? null });
        if (error) throw error;
        toast.success("Customer added to directory");
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Customer removed from directory");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete customer");
    } finally {
      setDeleteTarget(null);
    }
  };

  const exportCSV = () => {
    if (customers.length === 0) {
      toast.error("No customer records to export");
      return;
    }
    const headers = ["Name", "Phone", "Email", "Address", "Total Spent", "Outstanding Debt", "Notes", "Created At"];
    const rows = customers.map((c) => {
      const s = customerStatsMap[c.id];
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.phone || "").replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${(c.address || "").replace(/"/g, '""')}"`,
        s?.total_spent || 0,
        s?.outstanding || 0,
        `"${(c.notes || "").replace(/"/g, '""')}"`,
        new Date(c.created_at).toLocaleDateString(),
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Puido_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported customer directory to CSV");
  };

  const formatWhatsAppLink = (phone: string | null, name: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? `234${cleanPhone.slice(1)}` : cleanPhone;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hello ${name}, reaching out from Puido Smart Solutions regarding your inquiry/orders.`)}`;
  };

  return (
    <div className="space-y-5 fade-in pb-12">
      {/* ── Executive Screen Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-xs backdrop-blur-md flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 p-2.5">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Customer Directory
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {totalStats.totalCustomers} {totalStats.totalCustomers === 1 ? "Client" : "Clients"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Manage client records, view sales &amp; invoice history, and track receivables.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 relative z-10 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFromInvoices}
            disabled={syncing}
            title="Scan past invoices and register any unlisted customers"
            className="h-11 sm:h-10 rounded-xl hover:bg-primary/5 hover:text-primary border-border/70 font-semibold transition-all px-2.5 sm:px-3 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-1.5 shrink-0 text-primary ${syncing ? "animate-spin" : ""}`} />
            <span className="truncate">Sync Invoices</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            title="Export all client records as CSV"
            className="h-11 sm:h-10 rounded-xl hover:bg-primary/5 hover:text-primary border-border/70 font-semibold transition-all px-2.5 sm:px-3.5 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            <Download className="h-4 w-4 text-primary mr-1 sm:mr-1.5 shrink-0" />
            <span className="truncate">Export CSV</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={openAdd}
            title="Create a new customer profile"
            className="h-11 sm:h-10 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all px-2.5 sm:px-4 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-1.5 shrink-0" />
            <span className="truncate">Add Client</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Directory Clients */}
        <Card className="rounded-2xl border-border/70 bg-card/85 backdrop-blur-xs shadow-xs p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Clients
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {totalStats.totalCustomers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Registered in showroom</p>
          </div>
        </Card>

        {/* Active Transacting Clients */}
        <Card className="rounded-2xl border-border/70 bg-card/85 backdrop-blur-xs shadow-xs p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Buyers
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {totalStats.withOrdersCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">With sales or invoices</p>
          </div>
        </Card>

        {/* Total Billed Revenue */}
        <Card className="rounded-2xl border-border/70 bg-card/85 backdrop-blur-xs shadow-xs p-4 flex flex-col justify-between hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground tabular-nums truncate">
              ₦{totalStats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Recorded transaction value</p>
          </div>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="rounded-2xl border-border/70 bg-card/85 backdrop-blur-xs shadow-xs p-4 flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Outstanding Debt
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums truncate ${
                totalStats.totalOutstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              }`}
            >
              ₦{totalStats.totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Pending client receivables</p>
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Controls Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="customer-search-input"
            placeholder="Search by client name, phone, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 h-11 sm:h-10 bg-card/80 backdrop-blur-xs border-border/70 focus-visible:ring-primary/20 rounded-xl text-sm transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs & View Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <div className="flex items-center p-1 rounded-xl bg-card border border-border/70 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "all" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("debt")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === "debt" ? "bg-amber-600 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>With Debt</span>
              {customers.filter((c) => (customerStatsMap[c.id]?.outstanding || 0) > 0).length > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-white/20 text-white text-[10px] font-mono">
                  {customers.filter((c) => (customerStatsMap[c.id]?.outstanding || 0) > 0).length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("high_value")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "high_value" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              VIP (₦100k+)
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("recent")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === "recent" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Recent
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-card border border-border/70 shrink-0">
            <button
              type="button"
              title="Grid View"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "grid" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Table View"
              onClick={() => setViewMode("table")}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "table" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area: Loading Skeletons vs Empty State vs Grid / Table ── */}
      {customersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-2xl border-border/60 bg-card p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-36 bg-muted rounded-md" />
                <div className="h-8 w-16 bg-muted rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted/60 rounded" />
                <div className="h-4 w-40 bg-muted/60 rounded" />
              </div>
              <div className="h-8 bg-muted/40 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State with Quick Starter Actions */
        <Card className="rounded-3xl border border-dashed border-border/80 bg-linear-to-b from-card/90 to-card/40 p-8 sm:p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-inner">
              <Users className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {customers.length === 0 ? "No Customer Profiles Yet" : "No Matching Customers Found"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {customers.length === 0
                  ? "Build your client directory to link sales orders, issue branded PDF invoices, and monitor client receivables in real time."
                  : `No customer records matched your query "${search}". Try searching with a different keyword or clear your filter.`}
              </p>
            </div>

            {customers.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  onClick={openAdd}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>

                {invoicesData.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleSyncFromInvoices}
                    disabled={syncing}
                    className="w-full sm:w-auto h-11 px-4 rounded-xl border-border/80 hover:bg-primary/5 hover:text-primary font-semibold active:scale-[0.98]"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 text-primary ${syncing ? "animate-spin" : ""}`} />
                    Sync from Invoices ({invoicesData.length})
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleSeedSampleClients}
                  disabled={syncing}
                  className="w-full sm:w-auto h-11 px-4 rounded-xl border-border/80 hover:bg-primary/5 hover:text-primary font-semibold active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Load Sample Clients
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("all");
                }}
                className="h-10 px-4 rounded-xl font-semibold border-border/80"
              >
                Clear Search &amp; Filters
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map((c) => {
            const stats = customerStatsMap[c.id];
            const waLink = formatWhatsAppLink(c.phone, c.name);
            const initials = c.name
              .split(" ")
              .filter(Boolean)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <Card
                key={c.id}
                onClick={() => setSelected(c)}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card hover:bg-card/95 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5 text-left"
              >
                <div>
                  {/* Card Header: Avatar, Name & Actions */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                        {initials || "CL"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>Joined {new Date(c.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        title="Edit customer"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete customer"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Contact Info List */}
                  <div className="py-3 space-y-1.5 text-xs text-muted-foreground">
                    {c.phone ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate text-foreground font-medium">
                          <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{c.phone}</span>
                        </div>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat on WhatsApp"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/60 italic">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>No phone number</span>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    {c.address && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}

                    {c.notes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 italic pt-1">
                        "{c.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Financial Badges & Details CTA */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="rounded-lg text-[11px] font-mono">
                      {stats?.total_orders || 0} sale{(stats?.total_orders || 0) === 1 ? "" : "s"}
                    </Badge>

                    {stats && stats.total_spent > 0 && (
                      <Badge variant="outline" className="rounded-lg text-[11px] font-mono border-border/70 font-semibold">
                        ₦{stats.total_spent.toLocaleString()}
                      </Badge>
                    )}

                    {stats && stats.outstanding > 0 && (
                      <Badge variant="destructive" className="rounded-lg text-[11px] font-mono font-bold">
                        ₦{stats.outstanding.toLocaleString()} owed
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                    <span>History</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((c) => {
                  const stats = customerStatsMap[c.id];
                  const waLink = formatWhatsAppLink(c.phone, c.name);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground hover:text-primary">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Joined {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{c.phone || "—"}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {c.email || ""}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate">
                        {c.address || "—"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {stats?.total_orders || 0}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        ₦{(stats?.total_spent || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {(stats?.outstanding || 0) > 0 ? (
                          <span className="text-destructive font-bold">
                            ₦{stats!.outstanding.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">₦0</span>
                        )}
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(c)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Add / Edit Customer Modal ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-3xl max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>{form.id ? "Edit Customer Record" : "Add New Customer"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div>
              <Label htmlFor="f-name" className="text-xs font-semibold">
                Customer / Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="f-name"
                placeholder="e.g. Lekki Smart Residential Client / Mr. Adebayo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="h-11 rounded-xl mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="f-phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="f-phone"
                  placeholder="e.g. +234 803 123 4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={30}
                  className="h-11 rounded-xl mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="f-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="f-email"
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  className="h-11 rounded-xl mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="f-address" className="text-xs font-semibold">
                Delivery / Project Address
              </Label>
              <Input
                id="f-address"
                placeholder="e.g. Plot 12, Admiralty Way, Lekki Phase 1, Lagos"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                maxLength={300}
                className="h-11 rounded-xl mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="f-notes" className="text-xs font-semibold">
                Client Notes &amp; Preferences
              </Label>
              <Textarea
                id="f-notes"
                placeholder="e.g. Prefers Tuya Zigbee motorized tracks; requests installation on weekends."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={1000}
                rows={3}
                className="rounded-xl mt-1.5 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="h-11 px-4 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs active:scale-[0.98]"
            >
              {saving ? "Saving..." : form.id ? "Update Client" : "Save Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Customer Detail & Financial History Modal ── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          {selected && (
            <div className="space-y-5">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-sm text-primary">
                    {selected.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-foreground">
                      {selected.name}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>Customer Profile</span>
                      <span>•</span>
                      <span>Added {new Date(selected.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const c = selected;
                      setSelected(null);
                      openEdit(c);
                    }}
                    className="h-9 px-3 rounded-xl border-border/80 text-xs font-semibold"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Profile
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelected(null);
                      navigate("/create-invoice");
                    }}
                    className="h-9 px-3.5 rounded-xl font-bold bg-primary text-primary-foreground text-xs shadow-xs"
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
                    Create Invoice
                  </Button>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Phone &amp; WhatsApp
                  </span>
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>{selected.phone || "Not recorded"}</span>
                    {selected.phone && formatWhatsAppLink(selected.phone, selected.name) && (
                      <a
                        href={formatWhatsAppLink(selected.phone, selected.name)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline text-[11px] font-bold"
                      >
                        Chat
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Email Address
                  </span>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="hover:underline text-primary">
                        {selected.email}
                      </a>
                    ) : (
                      "Not recorded"
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Project / Delivery Address
                  </span>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {selected.address || "Not recorded"}
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                  <strong className="text-foreground font-semibold">Notes: </strong>
                  {selected.notes}
                </div>
              )}

              {/* Financial Metrics Summary Banner */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-linear-to-br from-primary/5 via-card to-card border border-primary/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Invoiced / Spent
                  </span>
                  <div className="text-lg font-black font-mono text-foreground mt-0.5">
                    ₦{(customerStatsMap[selected.id]?.total_spent || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Paid
                  </span>
                  <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₦{(customerStatsMap[selected.id]?.total_paid || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Outstanding Debt
                  </span>
                  <div
                    className={`text-lg font-black font-mono mt-0.5 ${
                      (customerStatsMap[selected.id]?.outstanding || 0) > 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    ₦{(customerStatsMap[selected.id]?.outstanding || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions Tabs: Sales vs Invoices */}
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl">
                  <TabsTrigger value="sales" className="rounded-lg text-xs font-bold">
                    <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                    Sales Records ({selectedSales.length})
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="rounded-lg text-xs font-bold">
                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
                    Invoices ({selectedInvoices.length})
                  </TabsTrigger>
                </TabsList>

                {/* Sales Tab */}
                <TabsContent value="sales" className="pt-3">
                  {selectedSalesLoading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                      Loading sales transactions...
                    </div>
                  ) : selectedSales.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                      No sales transactions linked directly to this customer ID yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-xs text-left min-w-[500px]">
                        <thead className="bg-muted/40 text-muted-foreground font-bold border-b">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Item Description</th>
                            <th className="py-2.5 px-3 text-right">Qty</th>
                            <th className="py-2.5 px-3 text-right">Total (₦)</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {selectedSales.map((s: any) => (
                            <tr key={s.id} className="hover:bg-muted/30">
                              <td className="py-2 px-3">{new Date(s.sale_date).toLocaleDateString()}</td>
                              <td className="py-2 px-3 font-medium">
                                {s["inventory list"]?.["Item Description"] || "Inventory Item"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">{s.quantity}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                ₦{Number(s.total_amount || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center capitalize">
                                <Badge
                                  variant={s.payment_status === "paid" ? "secondary" : "outline"}
                                  className="text-[10px]"
                                >
                                  {s.payment_status?.replace("_", " ") || "recorded"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="pt-3">
                  {selectedInvoices.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                      No invoices created for this client yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-xs text-left min-w-[500px]">
                        <thead className="bg-muted/40 text-muted-foreground font-bold border-b">
                          <tr>
                            <th className="py-2.5 px-3">Invoice #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {selectedInvoices.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-muted/30">
                              <td className="py-2 px-3 font-mono font-bold text-primary">
                                #{inv.invoice_number}
                              </td>
                              <td className="py-2 px-3">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                ₦{Number(inv.total_amount || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Alert Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Delete Customer Profile?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
              This will remove <strong>"{deleteTarget?.name}"</strong> from your customer directory. Historical sales and invoices will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <AlertDialogCancel className="h-11 px-4 rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-11 px-5 rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
