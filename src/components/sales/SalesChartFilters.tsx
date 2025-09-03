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
    <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Chart Type Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Chart Type</label>
        <div className="flex rounded-lg border bg-background p-1">
          {(['bar', 'line', 'pie'] as const).map((type) => {
            const Icon = chartTypeIcons[type];
            return (
              <Button
                key={type}
                variant={filters.chartType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, chartType: type })}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline capitalize">{type}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Time Period</label>
        <Select 
          value={filters.timePeriod} 
          onValueChange={(value: ChartFilters['timePeriod']) => 
            onFiltersChange({ ...filters, timePeriod: value })
          }
        >
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
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
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Location</label>
        <Select 
          value={filters.location} 
          onValueChange={(value: ChartFilters['location']) => 
            onFiltersChange({ ...filters, location: value })
          }
        >
          <SelectTrigger className="w-32">
            <MapPin className="h-4 w-4 mr-2" />
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