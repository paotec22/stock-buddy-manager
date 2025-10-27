import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { InstallationsTable } from "@/components/reports/InstallationsTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityTimeline } from "@/components/reports/ActivityTimeline";
import { ExpenseTrendChart } from "@/components/reports/ExpenseTrendChart";
import { ExpenseCategoryChart } from "@/components/reports/ExpenseCategoryChart";
import { SearchInput } from "@/components/ui/search-input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReportsFilterSheet } from "@/components/reports/ReportsFilterSheet";
import { RefreshCw, BarChart3, Receipt, Wrench, MapPin, Activity } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("overview");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['installations'] }),
        queryClient.invalidateQueries({ queryKey: ['location-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-trends'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-categories'] }),
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
        <main className={`flex-1 ${isMobile ? 'pb-20' : 'p-4 md:p-6'}`}>
          <div className={`${isMobile ? 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b p-4' : 'flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'}`}>
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
                <>
                  <div className="w-full md:w-[250px]">
                    <SearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search reports..."
                      className="glass-effect"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className={isMobile ? 'px-4' : ''}>
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} mb-6`}>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {!isMobile && "Overview"}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                {!isMobile && "Expenses"}
              </TabsTrigger>
              <TabsTrigger value="installations" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {!isMobile && "Installations"}
              </TabsTrigger>
              {!isMobile && (
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locations
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {!isMobile && "Activity"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExpenseTrendChart dateFrom={dateFrom} dateTo={dateTo} />
                <ExpenseCategoryChart dateFrom={dateFrom} dateTo={dateTo} />
              </div>
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
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExpenseTrendChart dateFrom={dateFrom} dateTo={dateTo} />
                <ExpenseCategoryChart dateFrom={dateFrom} dateTo={dateTo} />
              </div>
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
            </TabsContent>

            <TabsContent value="installations" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="locations" className="space-y-6">
              <Card className="card-hover">
                <LocationPerformanceTable searchTerm={searchTerm} />
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="p-6">
                <ActivityTimeline searchTerm={searchTerm} />
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
