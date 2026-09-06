import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ShoppingCart, Package, DollarSign, TrendingDown, Clock, Filter } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  action_type: string;
  table_name: string;
  item_description: string;
  location: string | null;
  quantity: number | null;
  amount: number | null;
  created_at: string;
}

interface ActivityTimelineProps {
  searchTerm?: string;
}

const TABLE_OPTIONS = [
  { value: "all", label: "All activities" },
  { value: "sales", label: "Sales" },
  { value: "inventory list", label: "Inventory" },
  { value: "installations", label: "Installations" },
  { value: "expenses", label: "Expenses" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "INSERT", label: "Added" },
  { value: "UPDATE", label: "Updated" },
  { value: "DELETE", label: "Deleted" },
];

export function ActivityTimeline({ searchTerm = "" }: ActivityTimelineProps) {
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ActivityLog[];
    }
  });

  const filteredLogs = useMemo(() => {
    let result = logs ?? [];

    if (tableFilter !== "all") {
      result = result.filter(log => log.table_name === tableFilter);
    }

    if (actionFilter !== "all") {
      result = result.filter(log => log.action_type === actionFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.item_description?.toLowerCase().includes(term) ||
        log.location?.toLowerCase().includes(term) ||
        log.action_type?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [logs, tableFilter, actionFilter, searchTerm]);

  const hasActiveFilters = tableFilter !== "all" || actionFilter !== "all";

  const getActionIcon = (tableName: string) => {
    switch (tableName) {
      case 'sales':
        return <ShoppingCart className="h-5 w-5" />;
      case 'inventory list':
        return <Package className="h-5 w-5" />;
      case 'installations':
        return <DollarSign className="h-5 w-5" />;
      case 'expenses':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActionLabel = (actionType: string, tableName: string) => {
    const action = actionType === 'INSERT' ? 'Added' : actionType === 'UPDATE' ? 'Updated' : 'Deleted';
    const table = tableName === 'inventory list' ? 'Inventory' : tableName.charAt(0).toUpperCase() + tableName.slice(1);
    return `${action} ${table}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Filter Activity Feed</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 text-[11px] font-mono">
              {(tableFilter !== "all" ? 1 : 0) + (actionFilter !== "all" ? 1 : 0)} active
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:items-center">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs sm:text-sm bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {TABLE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs sm:text-sm bg-background">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTableFilter("all");
                setActionFilter("all");
              }}
              className="col-span-2 sm:col-span-1 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs sm:text-sm">Loading activity logs...</span>
        </div>
      ) : !filteredLogs.length ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Clock className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm font-medium">No activity records found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className="relative">
              {index < filteredLogs.length - 1 && (
                <div className="absolute left-4 sm:left-5 top-10 sm:top-12 w-0.5 h-[calc(100%-0.5rem)] bg-border/60" />
              )}

              <div className="flex gap-2.5 sm:gap-4 pb-2">
                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center ${getActionColor(log.action_type)}`}>
                  {getActionIcon(log.table_name)}
                </div>

                <div className="flex-1 min-w-0 bg-card border border-border/80 rounded-lg p-3 sm:p-4 shadow-xs hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[240px] sm:max-w-md">
                        {log.item_description}
                      </h4>
                      <Badge variant="outline" className={`text-[10px] sm:text-xs font-medium py-0 px-1.5 ${getActionColor(log.action_type)}`}>
                        {getActionLabel(log.action_type, log.table_name)}
                      </Badge>
                    </div>
                    <time className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap font-mono shrink-0">
                      {format(new Date(log.created_at), 'MMM dd, h:mm a')}
                    </time>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 text-xs pt-1 border-t border-border/40">
                    {log.location && (
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Location</span>
                        <p className="font-medium text-foreground truncate">{log.location}</p>
                      </div>
                    )}
                    {log.quantity !== null && (
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Quantity</span>
                        <p className="font-medium font-mono text-foreground">{log.quantity}</p>
                      </div>
                    )}
                    {log.amount !== null && (
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Amount</span>
                        <p className="font-semibold font-mono text-primary tabular-nums">{formatCurrency(log.amount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
