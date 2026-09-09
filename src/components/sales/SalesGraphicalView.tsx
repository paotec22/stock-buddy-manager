import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { SalesChartFilters, ChartFilters } from "./SalesChartFilters";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Sale {
  id: string;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  item_name: string;
  location: string;
}

interface SalesGraphicalViewProps {
  sales: Sale[];
  filters: ChartFilters;
  onFiltersChange: (filters: ChartFilters) => void;
}

export function SalesGraphicalView({ sales, filters, onFiltersChange }: SalesGraphicalViewProps) {
  const isMobile = useIsMobile();
  // Get unique locations
  const availableLocations = Array.from(new Set(sales.map(sale => sale.location))).filter(Boolean);

  // Filter sales based on time period and location
  const filteredSales = sales.filter(sale => {
    const saleDate = parseISO(sale.sale_date);
    const now = new Date();
    
    // Time period filter
    let inTimePeriod = false;
    switch (filters.timePeriod) {
      case 'month':
        inTimePeriod = saleDate >= startOfMonth(now) && saleDate <= endOfMonth(now);
        break;
      case 'quarter':
        inTimePeriod = saleDate >= startOfQuarter(now) && saleDate <= endOfQuarter(now);
        break;
      case 'year':
        inTimePeriod = saleDate >= startOfYear(now) && saleDate <= endOfYear(now);
        break;
      case 'all':
      default:
        inTimePeriod = true;
        break;
    }

    // Location filter
    const inLocation = filters.location === 'all' || sale.location === filters.location;

    return inTimePeriod && inLocation;
  });

  // Process data for charts
  const processChartData = () => {
    if (filters.chartType === 'pie') {
      // For pie chart, group by location
      const locationSales = filteredSales.reduce((acc: { [key: string]: number }, sale) => {
        const location = sale.location || 'Unknown';
        acc[location] = (acc[location] || 0) + sale.total_amount;
        return acc;
      }, {});

      return Object.entries(locationSales).map(([location, amount]) => ({
        name: location,
        value: amount,
        formattedValue: formatCurrency(amount)
      }));
    } else {
      // For bar/line charts, group by month
      const monthlySales = filteredSales.reduce((acc: { [key: string]: { [location: string]: number } }, sale) => {
        const monthKey = format(parseISO(sale.sale_date), 'yyyy-MM');
        const location = sale.location || 'Unknown';
        
        if (!acc[monthKey]) acc[monthKey] = {};
        acc[monthKey][location] = (acc[monthKey][location] || 0) + sale.total_amount;
        return acc;
      }, {});

      return Object.entries(monthlySales)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, locationData]) => ({
          month: format(parseISO(monthKey + '-01'), 'MMM yyyy'),
          monthKey,
          ...locationData,
          total: Object.values(locationData).reduce((sum, val) => sum + val, 0)
        }));
    }
  };

  const chartData = processChartData();

  // Calculate summary statistics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const averageSale = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Chart colors using semantic tokens
  const chartColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(217 91% 60%)',
  ];

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))"
    }
  };

  const chartHeight = isMobile ? 280 : 380;

  const renderChart = () => {
    if (filters.chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={isMobile ? undefined : ({ name, value }) => `${name}: ${formatCurrency(value as number)}`}
              outerRadius={isMobile ? 85 : 120}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatCurrency(value as number), 'Sales']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (filters.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={isMobile ? 65 : 80}
            />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value as number), name]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            {availableLocations.map((location, index) => (
              <Line
                key={location}
                type="monotone"
                dataKey={location}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={3}
                dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={isMobile ? 65 : 80}
            />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value as number), name]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            {availableLocations.map((location, index) => (
              <Bar
                key={location}
                dataKey={location}
                fill={chartColors[index % chartColors.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <SalesChartFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        availableLocations={availableLocations}
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Sales</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base sm:text-lg lg:text-xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              {filteredSales.length} transactions
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Average Sale</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base sm:text-lg lg:text-xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {formatCurrency(averageSale)}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              per transaction
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Quantity</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base sm:text-lg lg:text-xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {totalQuantity.toLocaleString()}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              items sold
            </p>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-3 sm:p-5">
        <div className="pb-3 sm:pb-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
            {filters.chartType === 'pie' ? 'Sales by Location' : 'Sales Over Time'}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              ({filters.timePeriod === 'all' ? 'All Time' : `${filters.timePeriod.charAt(0).toUpperCase() + filters.timePeriod.slice(1)}`})
            </span>
          </h3>
        </div>
        <ChartContainer config={chartConfig}>
          {chartData.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64 text-xs sm:text-sm text-muted-foreground">
              No data available for the selected filters
            </div>
          )}
        </ChartContainer>
      </Card>
    </div>
  );
}