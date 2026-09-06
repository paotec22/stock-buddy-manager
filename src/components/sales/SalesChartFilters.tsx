import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, BarChart3, TrendingUp, PieChart } from "lucide-react";

export interface ChartFilters {
  chartType: 'bar' | 'line' | 'pie';
  timePeriod: 'month' | 'quarter' | 'year' | 'all';
  location: 'all' | 'Raja' | 'Cement';
}

interface SalesChartFiltersProps {
  filters: ChartFilters;
  onFiltersChange: (filters: ChartFilters) => void;
  availableLocations: string[];
}

export function SalesChartFilters({ filters, onFiltersChange, availableLocations }: SalesChartFiltersProps) {
  const chartTypeIcons = {
    bar: BarChart3,
    line: TrendingUp,
    pie: PieChart
  };

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-xl border border-border">
      {/* Chart Type Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Chart Type</label>
        <div className="flex rounded-lg border bg-background p-0.5">
          {(['bar', 'line', 'pie'] as const).map((type) => {
            const Icon = chartTypeIcons[type];
            return (
              <Button
                key={type}
                variant={filters.chartType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, chartType: type })}
                className="h-8 px-2 sm:px-3 flex items-center gap-1.5 text-xs"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize">{type}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Time Period</label>
        <Select 
          value={filters.timePeriod} 
          onValueChange={(value: ChartFilters['timePeriod']) => 
            onFiltersChange({ ...filters, timePeriod: value })
          }
        >
          <SelectTrigger className="w-[125px] sm:w-32 h-8 text-xs bg-background">
            <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Location</label>
        <Select 
          value={filters.location} 
          onValueChange={(value: ChartFilters['location']) => 
            onFiltersChange({ ...filters, location: value })
          }
        >
          <SelectTrigger className="w-[125px] sm:w-32 h-8 text-xs bg-background">
            <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {availableLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}