import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Layers,
  FileText,
  Clock,
  Sparkles,
  PieChart,
  Wallet,
  Building2,
  CheckCircle2,
  HelpCircle,
  Eye
} from "lucide-react";
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
  const { session } = useAuth();
  const navigate = useNavigate();

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
    enabled: !!session?.user?.id
  });

  const isInventoryManager = userRole === 'inventory_manager';

  const { data, isLoading, isFetching, error, refetch } = useDashboardData({
    timeRange,
    location: selectedLocation
  });

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userDisplayName = session?.user?.email?.split('@')[0] || "Team Member";

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
    <div className="space-y-6 animate-fade-in pb-12">
        {/* =========================================================================
            1. HERO / COMMAND HEADER
           ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/30 p-5 sm:p-6 md:p-8 shadow-xs">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 h-48 w-48 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Store Operations Command
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {greeting}, <span className="capitalize">{userDisplayName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Real-time inventory valuation, revenue performance, order volume, and pending tasks across your sales channels.
              </p>
            </div>

            {/* Filter controls: Range Selector + Location + Refetch */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-auto">
              {/* Location Filter */}
              <div className="w-36 sm:w-44">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
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

              {/* Time Range Segmented Control */}
              <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/70 p-1 shadow-2xs">
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
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all select-none ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      {labels[range]}
                    </button>
                  );
                })}
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh dashboard metrics"
                className="h-9 w-9 rounded-lg bg-background/80 border-border/80 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isFetching ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Quick Action Buttons Strip */}
          <div className="relative mt-6 pt-5 border-t border-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 hidden sm:inline">
              Quick Actions:
            </span>

            <Button
              asChild
              size="sm"
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
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
                className="h-8 px-3 text-xs font-medium gap-1.5 bg-background/80 hover:bg-muted"
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
              className="h-8 px-3 text-xs font-medium gap-1.5 bg-background/80 hover:bg-muted"
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
                className="h-8 px-3 text-xs font-medium gap-1.5 bg-background/80 hover:bg-muted"
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
                className="h-8 px-3 text-xs font-medium gap-1.5 bg-background/80 hover:bg-muted"
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
              className="h-8 px-3 text-xs font-medium gap-1.5 bg-background/80 hover:bg-muted"
            >
              <Link to="/catalogue">
                <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Showroom Catalogue</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* =========================================================================
            2. EXECUTIVE KPI CARDS
           ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Revenue / Sales */}
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Sales Revenue
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(data?.totalRevenue || 0, currencies[0])}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    {data?.revenueGrowthPct !== null && data?.revenueGrowthPct !== undefined && (
                      <span className={`inline-flex items-center font-semibold ${
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
                    <span className="text-muted-foreground">
                      · {data?.totalSalesCount || 0} {data?.totalSalesCount === 1 ? 'sale' : 'sales'} ({data?.totalUnitsSold || 0} units)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Net Profit (Or Stock Items if inventory manager) */}
          {!isInventoryManager ? (
            <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Estimated Profit
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <div className={`text-2xl font-bold tracking-tight ${
                      (data?.netProfit || 0) >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-destructive'
                    }`}>
                      {formatCurrency(data?.netProfit || 0, currencies[0])}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {data?.profitMarginPct || 0}% margin
                      </span>
                      <span>·</span>
                      <span>after COGS & expenses</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Units in Stock
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Boxes className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold tracking-tight text-foreground">
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
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inventory Asset Value
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Package className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(data?.inventoryValuation || 0, currencies[0])}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
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
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {!isInventoryManager ? "Operating Expenses" : "Active Invoices"}
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {!isInventoryManager ? <Wallet className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {!isInventoryManager
                      ? formatCurrency(data?.totalExpenses || 0, currencies[0])
                      : `${data?.totalInvoicesCount || 0} Invoices`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
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
                <div className="space-y-3 pt-1">
                  {data?.paymentBreakdown.map((item) => {
                    const totalAmt = data.totalRevenue || 1;
                    const pct = Math.min(100, Math.round((item.amount / totalAmt) * 100));
                    const isPaid = item.status.toLowerCase().includes('paid');
                    const isPartial = item.status.toLowerCase().includes('partial');

                    return (
                      <div key={item.status} className="space-y-1.5 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${
                              isPaid ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            {item.status}
                          </span>
                          <span className="font-mono text-muted-foreground">
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
                        <div className="text-[11px] text-muted-foreground">
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
          {/* Section A: Low Stock & Reorder Warnings */}
          <Card className="border-border/70 bg-card/80 backdrop-blur-xs shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Stock Reorder Alerts</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Items with 5 or fewer units remaining
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {data?.lowStockItems?.length || 0} items
              </Badge>
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
                  <p className="text-xs font-semibold text-foreground">Stock Levels Healthy</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    No items currently below the critical reorder threshold.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition-colors text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Location: {item.location} · {formatCurrency(item.price, currencies[0])}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                          item.quantity <= 0
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}>
                          {item.quantity <= 0 ? 'Out of stock' : `${item.quantity} left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 pt-2 border-t border-border/50">
              <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between">
                <Link to="/inventory">
                  <span>Go to Inventory Management</span>
                  <ArrowRight className="h-3.5 w-3.5" />
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
                <div className="space-y-2">
                  {data?.recentInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition-colors text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground font-mono">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {inv.customerName}
                          {inv.invoiceDate && ` · ${format(new Date(inv.invoiceDate), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold font-mono text-foreground">
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
                <div className="space-y-2">
                  {data?.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition-colors text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">
                          {sale.itemName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
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
                        <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
      </div>
  );
};

export default Dashboard;
