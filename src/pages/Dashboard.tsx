import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useDashboardData, 
  DashboardTimeRange 
} from "@/hooks/useDashboardData";
import { formatCurrency } from "@/utils/formatters";
import { currencies } from "@/components/invoice/CurrencyChanger";
import { useAuth } from "@/components/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getRoleLabel } from "@/utils/roles";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Boxes,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ShoppingCart,
  Wrench,
  Activity,
  PieChart,
  Wallet,
  Building2,
  CheckCircle2,
  Eye,
  Download
} from "lucide-react";
import { QuickExportHubModal } from "@/components/dashboard/QuickExportHubModal";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('30d');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("export") === "true") {
      setExportModalOpen(true);
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("speed") === "true") {
      window.dispatchEvent(new CustomEvent("open-speed-health-modal"));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      return profile?.role;
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 30,
  });

  const isInventoryManager = userRole === 'inventory_manager';

  const { data, isLoading, isFetching, error, refetch } = useDashboardData({
    timeRange,
    location: selectedLocation
  });

  const { displayName, hasCustomName } = useUserProfile();

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Unable to Load Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          We encountered an issue retrieving your operational metrics. Please check your network connection and retry.
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-8">
        {/* =========================================================================
            1. HERO / COMMAND HEADER
           ========================================================================= */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  Store Operations
                </span>
                <span aria-hidden="true">·</span>
                <span>{format(new Date(), "EEEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {greeting}, <span className="capitalize">{displayName}</span>
                </h1>
                {!hasCustomName && (
                  <Link
                    to="/settings"
                    className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                    title="Fill your user details in Profile Settings"
                  >
                    <span>Set your name in Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Real-time inventory valuation, revenue performance, order volume, and pending tasks across your sales channels.
              </p>
            </div>

            {/* Filter controls: Range Selector + Location + Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2">
                {/* Location Filter */}
                <div className="flex-1 sm:w-40">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-9 text-xs bg-background border-border/80">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground mr-1.5 shrink-0" />
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-medium">All Locations</SelectItem>
                      {(data?.availableLocations || []).map((loc) => (
                        <SelectItem key={loc} value={loc} className="text-xs">
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Refresh Button alongside Location */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Refresh dashboard metrics"
                  aria-label="Refresh dashboard metrics"
                  className="sm:hidden h-9 w-9 rounded-lg bg-background border-border/80 shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isFetching ? 'animate-spin text-primary' : ''}`} />
                </Button>
              </div>

              {/* Time Range Segmented Control (scrollable cleanly on narrow phones) */}
              <div className="overflow-x-auto no-scrollbar max-w-full">
                <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 p-1 min-w-full sm:min-w-0">
                  {(['today', '7d', '30d', 'month', 'all'] as DashboardTimeRange[]).map((range) => {
                    const labels: Record<DashboardTimeRange, string> = {
                      today: 'Today',
                      '7d': '7D',
                      '30d': '30D',
                      month: 'This Month',
                      all: 'All Time'
                    };
                    const active = timeRange === range;
                    return (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setTimeRange(range)}
                        className={`flex-1 sm:flex-initial whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors select-none cursor-pointer ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                        }`}
                      >
                        {labels[range]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh dashboard metrics"
                aria-label="Refresh dashboard metrics"
                className="hidden sm:inline-flex h-9 w-9 rounded-lg bg-background border-border/80 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isFetching ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Quick Action Buttons Strip (Horizontal scroll track on mobile to keep KPIs above the fold) */}
          <div className="pt-3.5 border-t border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap pb-0.5 sm:pb-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:inline shrink-0">
              Quick Actions:
            </span>

            <Button
              asChild
              size="sm"
              className="h-9 sm:h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs whitespace-nowrap shrink-0"
            >
              <Link to="/create-invoice">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Create Invoice</span>
              </Link>
            </Button>

            {!isInventoryManager && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted whitespace-nowrap shrink-0"
              >
                <Link to="/sales">
                  <ShoppingCart className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Record Sale</span>
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted whitespace-nowrap shrink-0"
            >
              <Link to="/inventory">
                <Boxes className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Manage Stock</span>
              </Link>
            </Button>

            {!isInventoryManager && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted whitespace-nowrap shrink-0"
              >
                <Link to="/expenses">
                  <Wallet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Log Expense</span>
                </Link>
              </Button>
            )}

            {!isInventoryManager && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted whitespace-nowrap shrink-0"
              >
                <Link to="/profit-analysis">
                  <PieChart className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Profit Analysis</span>
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted whitespace-nowrap shrink-0"
            >
              <Link to="/catalogue">
                <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Catalogue</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="h-9 sm:h-8 px-3 text-xs font-medium gap-1.5 bg-background hover:bg-muted text-foreground whitespace-nowrap shrink-0"
              title="1-Click comprehensive CSV & JSON data exports"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
            2. EXECUTIVE KPI CARDS
           ========================================================================= */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Revenue / Sales */}
          <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Sales Revenue
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    {formatCurrency(data?.totalRevenue || 0, currencies[0])}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5 text-xs">
                    {data?.revenueGrowthPct !== null && data?.revenueGrowthPct !== undefined && (
                      <span className={`inline-flex items-center font-semibold font-mono tabular-nums ${
                        data.revenueGrowthPct >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-destructive'
                      }`}>
                        {data.revenueGrowthPct >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 mr-0.5 inline" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 mr-0.5 inline" />
                        )}
                        {data.revenueGrowthPct >= 0 ? `+${data.revenueGrowthPct}%` : `${data.revenueGrowthPct}%`}
                      </span>
                    )}
                    <span className="text-muted-foreground tabular-nums">
                      · {data?.totalSalesCount || 0} {data?.totalSalesCount === 1 ? 'sale' : 'sales'} ({data?.totalUnitsSold || 0} units)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Net Profit (Or Stock Items if inventory manager) */}
          {!isInventoryManager ? (
            <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2 space-y-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Estimated Profit
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${
                      (data?.netProfit || 0) >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-destructive'
                    }`}>
                      {formatCurrency(data?.netProfit || 0, currencies[0])}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground tabular-nums">
                      <span className="font-semibold text-foreground">
                        {data?.profitMarginPct || 0}% margin
                      </span>
                      <span>·</span>
                      <span className="truncate">after COGS &amp; expenses</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2 space-y-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Units in Stock
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Boxes className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                      {data?.totalStockUnits?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Physical items across all shelves
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card 3: Inventory Valuation */}
          <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inventory Asset Value
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Package className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    {formatCurrency(data?.inventoryValuation || 0, currencies[0])}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">
                      {data?.totalSkus || 0} SKUs
                    </span>
                    <span>·</span>
                    <span>{data?.totalStockUnits?.toLocaleString() || 0} total units</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Operating Expenses / Invoiced Amount */}
          <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {!isInventoryManager ? "Operating Expenses" : "Active Invoices"}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                {!isInventoryManager ? <Wallet className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    {!isInventoryManager
                      ? formatCurrency(data?.totalExpenses || 0, currencies[0])
                      : `${data?.totalInvoicesCount || 0} Invoices`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                    {!isInventoryManager
                      ? "Costs in selected period"
                      : `${formatCurrency(data?.totalInvoicedAmount || 0, currencies[0])} billed`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            3. VISUAL CHARTS & BREAKDOWN
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Chart: Revenue & Profit Trend (8 columns on desktop) */}
          <Card className="lg:col-span-8 border-border/70 bg-card/80 backdrop-blur-xs shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
                  Revenue &amp; Cost Trajectory
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Timeline of gross sales and operating expenditures
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-medium">
                {timeRange.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[320px] w-full mt-4 rounded-xl" />
              ) : (data?.chartData || []).length === 0 ? (
                <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground text-xs">
                  <Activity className="h-8 w-8 mb-2 opacity-40" />
                  No transactions recorded for this timeframe
                </div>
              ) : (
                <div className="h-[320px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data?.chartData || []}
                      margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
                          if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}k`;
                          return `₦${value}`;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderRadius: '10px',
                          border: '1px solid hsl(var(--border))',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(val: number, name: string) => [
                          formatCurrency(val, currencies[0]),
                          name === 'revenue' ? 'Sales Revenue' : name === 'expenses' ? 'Expenses' : 'Net Profit'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                      />
                      {!isInventoryManager && (
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="expenses"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#expenseGradient)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Card: Payment Breakdown & Store Health (4 columns on desktop) */}
          <Card className="lg:col-span-4 border-border/70 bg-card/80 backdrop-blur-xs shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
                Payment Collection Status
              </CardTitle>
              <CardDescription className="text-xs">
                Settlement breakdown of sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {isLoading ? (
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (data?.paymentBreakdown || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs">
                  <CheckCircle2 className="h-7 w-7 mb-2 text-emerald-500 opacity-70" />
                  No payment records in selected period
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {data?.paymentBreakdown.map((item) => {
                    const totalAmt = data.totalRevenue || 1;
                    const pct = Math.min(100, Math.round((item.amount / totalAmt) * 100));
                    const isPaid = item.status.toLowerCase().includes('paid');
                    const isPartial = item.status.toLowerCase().includes('partial');

                    return (
                      <div key={item.status} className="space-y-1.5 py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${
                              isPaid ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            {item.status}
                          </span>
                          <span className="font-mono text-muted-foreground tabular-nums">
                            {formatCurrency(item.amount, currencies[0])} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPaid ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          {item.count} transaction{item.count === 1 ? '' : 's'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Service Installation Alert Banner if pending */}
              {(data?.pendingInstallationsCount || 0) > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      {data?.pendingInstallationsCount} Pending Installation{data?.pendingInstallationsCount === 1 ? '' : 's'}
                    </div>
                    <div className="text-amber-700 dark:text-amber-300/80 mt-0.5">
                      Technician appointments requiring scheduling or sign-off.
                    </div>
                    <Link
                      to="/expenses"
                      className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-200 hover:underline mt-1.5"
                    >
                      View queue <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            4. OPERATIONAL WORKBENCH: LOW STOCK ALERTS & LIVE STREAMS
           ========================================================================= */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Section A: Stock Runway & Reorder Intelligence */}
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Stock Runway & Reorder Intelligence</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Predictive days-left based on 30-day sales velocity
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {(data?.stockRunwaySummary?.criticalCount || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
                    {data?.stockRunwaySummary.criticalCount} Critical
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-xs">
                  {data?.lowStockItems?.length || 0} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2.5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (data?.lowStockItems || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Stock Runway Healthy</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    All products have sufficient coverage. No immediate restock required.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {data?.lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {item.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate tabular-nums">
                            {item.location} · {formatCurrency(item.price, currencies[0])}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`inline-block font-semibold text-xs font-mono tabular-nums ${
                            item.quantity <= 0
                              ? 'text-destructive'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.quantity <= 0 ? 'Out of stock' : `${item.quantity} left`}
                          </span>
                        </div>
                      </div>

                      {/* Velocity & Runway forecast row */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {item.runwayDays !== null && item.runwayDays !== undefined ? (
                            <span className={item.runwayDays <= 7 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-amber-600 dark:text-amber-400"}>
                              {item.runwayDays === 0 ? "Depleted" : `~${item.runwayDays}d runway`}
                            </span>
                          ) : (
                            <span>No recent sales</span>
                          )}
                          {item.unitsSold30d ? ` · ${item.unitsSold30d} sold/30d` : ''}
                        </span>
                        {item.recommendedReorder && item.recommendedReorder > 0 ? (
                          <Link
                            to="/purchases"
                            className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                            title="Go to Purchases to create order"
                          >
                            <span>Reorder +{item.recommendedReorder}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold justify-between flex-1">
                <Link to="/inventory">
                  <span>Manage Stock</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold h-7">
                <Link to="/purchases">
                  <span>Supplier Orders</span>
                </Link>
              </Button>
            </div>
          </Card>

          {/* Section B: Recent Invoices Stream */}
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span>Recent Customer Invoices</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Latest commercial invoices issued
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-7 text-[11px] px-2">
                <Link to="/create-invoice">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (data?.recentInvoices || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <FileSpreadsheet className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-foreground">No Invoices Issued Yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    Generate your first professional invoice with line item discounts and PDF export.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {data?.recentInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground font-mono tabular-nums">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {inv.customerName}
                          {inv.invoiceDate && ` · ${format(new Date(inv.invoiceDate), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold font-mono text-foreground tabular-nums">
                          {formatCurrency(inv.totalAmount, currencies[0])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 pt-2 border-t border-border/50">
              <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between">
                <Link to="/create-invoice">
                  <span>Open Invoice Generator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Section C: Live Sales Feed */}
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recent Sales Log</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Live record of completed customer transactions
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-7 text-[11px] px-2">
                <Link to="/sales">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (data?.recentSales || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-foreground">No Sales Logged</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    Sales entered will automatically feed real-time insights and profit analysis.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {data?.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">
                          {sale.itemName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                          <span>Qty: {sale.quantity}</span>
                          <span>·</span>
                          <span className="capitalize">{sale.paymentStatus}</span>
                          {sale.saleDate && (
                            <>
                              <span>·</span>
                              <span>{format(new Date(sale.saleDate), 'MMM d, h:mm a')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrency(sale.totalAmount, currencies[0])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 pt-2 border-t border-border/50">
              <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between">
                <Link to="/sales">
                  <span>Open Full Sales Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Global Executive Modals */}
        <QuickExportHubModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          currencySymbol={currencies[0]?.symbol || "₦"}
        />
      </div>
  );
};

export default Dashboard;
