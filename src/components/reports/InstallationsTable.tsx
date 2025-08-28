import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InstallationsExportModal } from "./InstallationsExportModal";
import { formatCurrency } from "@/utils/formatters";

interface InstallationRecord {
  id: number;
  date: string;
  description: string;
  amount: number;
}

interface Installation {
  id: number;
  description: string;
  amount: number;
  installation_date: string;
  user_id: string;
  created_at: string;
}

interface InstallationsTableProps {
  searchTerm?: string;  
}

export function InstallationsTable({ searchTerm = "" }: InstallationsTableProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: installations = [], isLoading, error } = useQuery({
    queryKey: ['installations', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('installations')
        .select('*')
        .order('installation_date', { ascending: false });

      if (dateFrom) {
        query = query.gte('installation_date', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('installation_date', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Installation[];
    }
  });

  const installationRecords: InstallationRecord[] = installations.map(installation => ({
    id: installation.id,
    date: format(new Date(installation.installation_date), 'MMM dd, yyyy'),
    description: installation.description,
    amount: installation.amount,
  }));

  const allInstallations = installations;

  const filteredRecords = installationRecords.filter(record =>
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Loading installations...</div>;
  if (error) return <div>Error loading installations</div>;

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <>
      <Card className="glass-effect">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Installation Records</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear Dates
              </Button>
            )}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No installation records found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(record.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {filteredRecords.length} installation{filteredRecords.length !== 1 ? 's' : ''}
                </span>
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(totalAmount)}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <InstallationsExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        installations={allInstallations}
      />
    </>
  );
}