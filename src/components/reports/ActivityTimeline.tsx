import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ShoppingCart, Package, DollarSign, TrendingDown, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

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

export function ActivityTimeline({ searchTerm = "" }: ActivityTimelineProps) {
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

  const filteredLogs = searchTerm.trim()
    ? logs?.filter(log =>
        log.item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

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

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading activity...</div>;
  }

  if (!filteredLogs?.length) {
    return <div className="py-8 text-center text-muted-foreground">No recent activity found</div>;
  }

  return (
    <div className="space-y-4">
      {filteredLogs.map((log, index) => (
        <div key={log.id} className="relative">
          {/* Timeline line */}
          {index < filteredLogs.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
          )}
          
          <div className="flex gap-4 pb-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getActionColor(log.action_type)}`}>
              {getActionIcon(log.table_name)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {log.item_description}
                  </h4>
                  <Badge variant="outline" className={getActionColor(log.action_type)}>
                    {getActionLabel(log.action_type, log.table_name)}
                  </Badge>
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'MMM dd, h:mm a')}
                </time>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                {log.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{log.location}</p>
                  </div>
                )}
                {log.quantity !== null && (
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-medium">{log.quantity}</p>
                  </div>
                )}
                {log.amount !== null && (
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium text-primary">{formatCurrency(log.amount)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
