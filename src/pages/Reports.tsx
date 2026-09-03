import { useState } from "react";
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
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Financial trends, expenses breakdown, and installation logs</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-[240px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search reports..."
                className="h-10 md:h-9 text-sm"
              />
            </div>
            {isMobile && (
              <ReportsFilterSheet
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClearDates={clearDates}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[40px] md:min-h-0 bg-background border-input hover:bg-muted font-medium px-3"
              title="Refresh reports"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} md:mr-1.5`} />
              <span className="hidden md:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-5 h-11 p-1 bg-muted rounded-lg">
          <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-medium">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center justify-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-medium">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="installations" className="flex items-center justify-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-medium">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Installations</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="hidden sm:flex items-center justify-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-medium">
            <MapPin className="h-4 w-4" />
            <span>Locations</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center justify-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-medium">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
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
    </div>
  );
};

export default Reports;
