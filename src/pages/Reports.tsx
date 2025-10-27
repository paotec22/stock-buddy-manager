import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { InstallationsTable } from "@/components/reports/InstallationsTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityLogsTable } from "@/components/reports/ActivityLogsTable";
import { SearchInput } from "@/components/ui/search-input";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReportsFilterSheet } from "@/components/reports/ReportsFilterSheet";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Reports = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expensesCollapsed, setExpensesCollapsed] = useState(false);
  const [installationsCollapsed, setInstallationsCollapsed] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['installations'] }),
        queryClient.invalidateQueries({ queryKey: ['location-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] }),
      ]);
      toast.success("Reports refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const clearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <main className={`flex-1 space-y-6 ${isMobile ? 'pb-20' : 'p-4 md:p-6'}`}>
          <div className={`${isMobile ? 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b p-4' : 'flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4'}`}>
            <h1 className="text-2xl font-bold">Reports</h1>
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full mt-3' : 'w-full md:w-auto'}`}>
              {isMobile ? (
                <>
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search reports..."
                    className="flex-1"
                  />
                  <ReportsFilterSheet
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onClearDates={clearDates}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-11 min-w-11"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              ) : (
                <div className="w-full md:w-[250px]">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search reports..."
                    className="glass-effect"
                  />
                </div>
              )}
            </div>
          </div>
          <div className={isMobile ? 'px-4 space-y-4' : 'space-y-6'}>
            <Card className="card-hover">
              <MonthlyExpensesTable 
                searchTerm={searchTerm} 
                isCollapsed={expensesCollapsed}
                onToggleCollapse={() => setExpensesCollapsed(!expensesCollapsed)}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClearDates={clearDates}
              />
            </Card>
            <Card className="card-hover">
              <InstallationsTable 
                searchTerm={searchTerm} 
                isCollapsed={installationsCollapsed}
                onToggleCollapse={() => setInstallationsCollapsed(!installationsCollapsed)}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClearDates={clearDates}
              />
            </Card>
            <Card className="card-hover">
              <LocationPerformanceTable searchTerm={searchTerm} />
            </Card>
            <Card className="card-hover">
              <ActivityLogsTable searchTerm={searchTerm} />
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
