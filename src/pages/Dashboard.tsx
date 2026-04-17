import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/utils/formatters";
import { currencies } from "@/components/invoice/CurrencyChanger";
import { Activity, CreditCard, DollarSign, Wrench, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

const Dashboard = () => {
  const { data, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-destructive">
        <AlertTriangle className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'uploader', 'inventory_manager', 'user']}>
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 md:p-8 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back. Here's what's happening with your store today.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(data?.todaysSalesAmount || 0, currencies[0])}</div>
                  <p className="text-xs text-muted-foreground mt-1">Recorded today</p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">30-Day Net Profit</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className={`text-2xl font-bold ${(data?.netProfit30Days || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(data?.netProfit30Days || 0, currencies[0])}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {(data?.netProfit30Days || 0) >= 0 ? <TrendingUp className="h-3 w-3 text-success"/> : <TrendingDown className="h-3 w-3 text-destructive"/>}
                    After expenses
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">30-Day Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(data?.totalExpenses30Days || 0, currencies[0])}</div>
                  <p className="text-xs text-muted-foreground mt-1">Operating costs</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Installations</CardTitle>
              <Wrench className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-2xl font-bold text-primary">{data?.pendingInstallationsCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires action</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7 mt-4">
          <Card className="col-span-4 md:col-span-7 lg:col-span-5 card-hover">
            <CardHeader>
              <CardTitle>Revenue Trend (30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [formatCurrency(value, currencies[0]), "Revenue"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* We'll add the recent activity logic in the next iteration if needed, for now a nice aesthetic placeholder for visual balance */}
          <Card className="col-span-3 md:col-span-7 lg:col-span-2 card-hover">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {data?.pendingInstallationsCount && data.pendingInstallationsCount > 0 ? (
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-warning/15 text-warning rounded-full">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pending Installations</p>
                        <p className="text-xs text-muted-foreground">{data.pendingInstallationsCount} installations require attention.</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-success/15 text-success rounded-full">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">System Online</p>
                      <p className="text-xs text-muted-foreground">All systems are running smoothly.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtectedRoute>
  );
};

export default Dashboard;
