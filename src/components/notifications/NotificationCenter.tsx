import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  AlertTriangle,
  FileText,
  Wrench,
  CheckCheck,
  ArrowRight,
  TrendingUp,
  PackageX,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { CUSTOM_SALE_SENTINEL_ITEM_NAME } from "@/utils/salesItemResolver";

interface NotificationItem {
  id: string;
  type: "stock" | "invoice" | "request" | "sale";
  title: string;
  description: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  actionUrl: string;
  actionLabel: string;
}

export function NotificationCenter() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "stock" | "invoice" | "request">("all");
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("si_read_notifications") || "[]");
    } catch {
      return [];
    }
  });

  // 1. Query low stock & out-of-stock items
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["notifications-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select('id, "Item Description", Quantity, location')
        .neq("Item Description", CUSTOM_SALE_SENTINEL_ITEM_NAME)
        .lte("Quantity", 5)
        .order("Quantity", { ascending: true })
        .limit(10);

      if (error) return [];
      return data || [];
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Query invoices with upcoming or past due dates
  const { data: dueInvoices = [] } = useQuery({
    queryKey: ["notifications-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, customer_name, total_amount, due_date, invoice_date")
        .not("due_date", "is", null)
        .order("due_date", { ascending: false })
        .limit(8);

      if (error) return [];
      return data || [];
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Query pending installation/service requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["notifications-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installation_requests")
        .select("id, product_name, status, created_at, location, notes")
        .eq("status", "Not installed")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) return [];
      return data || [];
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
  });

  // Assemble notifications
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // Stock alerts
    lowStockItems.forEach((raw) => {
      const qty = Number(raw.Quantity ?? 0);
      const isOut = qty <= 0;

      list.push({
        id: `stock-${raw.id}`,
        type: "stock",
        title: isOut ? "Out of Stock" : "Low Stock Alert",
        description: `"${raw["Item Description"]}" has only ${qty} units remaining (${raw.location || "Main"}).`,
        timestamp: "Live store status",
        severity: isOut ? "critical" : "warning",
        actionUrl: "/inventory",
        actionLabel: "View Stock",
      });
    });

    // Invoices with due dates
    dueInvoices.forEach((raw) => {
      const isOverdue = raw.due_date && new Date(raw.due_date) < new Date();

      list.push({
        id: `inv-${raw.id}`,
        type: "invoice",
        title: isOverdue ? "Invoice Due / Overdue" : "Upcoming Invoice Due Date",
        description: `Invoice #${raw.invoice_number} for ${raw.customer_name || "Customer"} (${formatCurrency(Number(raw.total_amount || 0))}).`,
        timestamp: raw.due_date ? `Due ${new Date(raw.due_date).toLocaleDateString()}` : "Scheduled",
        severity: isOverdue ? "critical" : "warning",
        actionUrl: "/reports",
        actionLabel: "View Invoices",
      });
    });

    // Requests
    pendingRequests.forEach((raw) => {
      list.push({
        id: `req-${raw.id}`,
        type: "request",
        title: "Pending Installation Request",
        description: `"${raw.product_name}" (${raw.location || "Main"})${raw.notes ? ` — ${raw.notes}` : ""}`,
        timestamp: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : "Awaiting fulfillment",
        severity: "info",
        actionUrl: "/request",
        actionLabel: "Open Requests",
      });
    });

    return list;
  }, [lowStockItems, dueInvoices, pendingRequests]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem("si_read_notifications", JSON.stringify(allIds));
    } catch {
      // Ignore
    }
  };

  const handleActionClick = (url: string, id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem("si_read_notifications", JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
    setOpen(false);
    navigate(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Operational Notifications & Stock Alerts"
          aria-label="Operational Notifications & Alerts"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 shadow-xl border-border rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-none">
                Store Operations Alerts
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} action item${unreadCount === 1 ? "" : "s"} require attention`
                  : "All store metrics healthy"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2 gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-3 pt-2 pb-1 border-b border-border/60 bg-card">
          <Tabs
            value={filter}
            onValueChange={(val) => setFilter(val as "all" | "stock" | "invoice" | "request")}
          >
            <TabsList className="grid grid-cols-4 h-7 p-0.5 bg-muted/60 rounded-lg text-[11px]">
              <TabsTrigger value="all" className="h-6 text-[11px] font-medium py-0">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="stock" className="h-6 text-[11px] font-medium py-0">
                Stock ({lowStockItems.length})
              </TabsTrigger>
              <TabsTrigger value="invoice" className="h-6 text-[11px] font-medium py-0">
                Bills ({dueInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="request" className="h-6 text-[11px] font-medium py-0">
                Req ({pendingRequests.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notification Feed */}
        <ScrollArea className="max-h-[340px] divide-y divide-border/60">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No alerts in this category</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Stock levels and pending transactions are in order.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isUnread = !readIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3 ${
                    isUnread ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Icon Indicator */}
                  <div
                    className={`mt-0.5 h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${
                      item.type === "stock"
                        ? item.severity === "critical"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                        : item.type === "invoice"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-purple-500/10 text-purple-600"
                    }`}
                  >
                    {item.type === "stock" ? (
                      item.severity === "critical" ? (
                        <PackageX className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )
                    ) : item.type === "invoice" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Wrench className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {item.title}
                      </span>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.timestamp}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActionClick(item.actionUrl, item.id)}
                        className="h-6 text-[10px] font-semibold text-primary hover:text-primary hover:bg-primary/10 px-2 gap-1 rounded-md"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>

        {/* Footer Quick Links */}
        <div className="p-2 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[11px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/inventory");
            }}
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Open Inventory</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/reports");
            }}
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Reports Ledger</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
