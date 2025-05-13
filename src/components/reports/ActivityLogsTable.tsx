
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface ActivityLog {
  id: number;
  action_type: string;
  table_name: string;
  item_description: string | null;
  location: string | null;
  quantity: number | null;
  amount: number | null;
  created_at: string;
}

interface ActivityLogsTableProps {
  searchTerm?: string;
}

export function ActivityLogsTable({ searchTerm = "" }: ActivityLogsTableProps) {
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      console.log('Fetching activity logs...');
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      return data as ActivityLog[];
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter logs based on search term
  const filteredLogs = searchTerm.trim() 
    ? activityLogs?.filter(log => 
        (log.action_type && log.action_type.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (log.item_description && log.item_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : activityLogs;

  return (
    <Card className="glass-effect fade-in">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading activity logs...</p>
        ) : filteredLogs?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell className="capitalize">{log.action_type.toLowerCase()}</TableCell>
                  <TableCell>{log.item_description || '-'}</TableCell>
                  <TableCell>{log.location || '-'}</TableCell>
                  <TableCell>{log.quantity || '-'}</TableCell>
                  <TableCell>{log.amount ? formatCurrency(log.amount) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No matching activity logs found</p>
        )}
      </CardContent>
    </Card>
  );
}
