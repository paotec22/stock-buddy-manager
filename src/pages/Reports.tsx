import { useState } from "react";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { InstallationsTable } from "@/components/reports/InstallationsTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityTimeline } from "@/components/reports/ActivityTimeline";
import { ExpenseTrendChart } from "@/components/reports/ExpenseTrendChart";
import { ExpenseCategoryChart } from "@/components/reports/ExpenseCategoryChart";
import { ReportsOverviewKpis } from "@/components/reports/ReportsOverviewKpis";
import { ReportsDateRangePicker } from "@/components/reports/ReportsDateRangePicker";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReportsFilterSheet } from "@/components/reports/ReportsFilterSheet";
import { RefreshCw, BarChart3, Receipt, Wrench, MapPin, Activity, ArrowRight } from "lucide-react";
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
        queryClient.invalidateQueries({ queryKey: ['kpi-expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['kpi-installations'] }),
        queryClient.invalidateQueries({ queryKey: ['kpi-sales'] }),
      ]);
      toast.success("Reports refreshed");
    } catch (error) {
      toast.error("Failed to refresh reports");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDateRangeChange = (from?: Date, to?: Date) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const clearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                Reports & Analytics
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary font-mono">
                Executive Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Financial trends, expenses breakdown, branch metrics, and installation records
            </p>
          </div>

          {/* Unified Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-[220px] min-w-[150px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search across reports..."
                className="h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Desktop / Tablet Date Range Picker */}
            <div className="hidden sm:block">
              <ReportsDateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>

            {/* Mobile Filter Sheet */}
            <div className="sm:hidden">
              <ReportsFilterSheet
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClearDates={clearDates}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 px-2.5 sm:px-3 bg-background border-input hover:bg-muted font-medium text-xs sm:text-sm"
              title="Refresh reports"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''} sm:mr-1.5`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-10 sm:h-11 p-1 bg-muted rounded-lg border border-border/60">
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium py-1 px-1 sm:px-3 truncate"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="expenses" 
            className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium py-1 px-1 sm:px-3 truncate"
          >
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Expenses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="installations" 
            className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium py-1 px-1 sm:px-3 truncate"
          >
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Install<span className="hidden sm:inline">ations</span></span>
          </TabsTrigger>
          <TabsTrigger 
            value="locations" 
            className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium py-1 px-1 sm:px-3 truncate"
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Branches</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium py-1 px-1 sm:px-3 truncate"
          >
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
          {/* Executive KPIs */}
          <ReportsOverviewKpis dateFrom={dateFrom} dateTo={dateTo} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
            <ExpenseTrendChart dateFrom={dateFrom} dateTo={dateTo} />
            <ExpenseCategoryChart dateFrom={dateFrom} dateTo={dateTo} />
          </div>

          {/* Branch Performance Snapshot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Operating Branches
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("locations")}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Full Branch Report
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <LocationPerformanceTable searchTerm={searchTerm} />
          </div>

          {/* Detailed Monthly Expenses Accordion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Expense Records
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("expenses")}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Manage All Expenses
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
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
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
            <ExpenseTrendChart dateFrom={dateFrom} dateTo={dateTo} />
            <ExpenseCategoryChart dateFrom={dateFrom} dateTo={dateTo} />
          </div>

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
        </TabsContent>

        {/* INSTALLATIONS TAB */}
        <TabsContent value="installations" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
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
        </TabsContent>

        {/* LOCATIONS TAB */}
        <TabsContent value="locations" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
          <LocationPerformanceTable searchTerm={searchTerm} />
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
          <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-xs">
            <ActivityTimeline searchTerm={searchTerm} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
