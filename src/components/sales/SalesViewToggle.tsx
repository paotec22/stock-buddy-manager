import { Button } from "@/components/ui/button";
import { BarChart3, Table } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesViewToggleProps {
  currentView: 'table' | 'chart';
  onViewChange: (view: 'table' | 'chart') => void;
}

export function SalesViewToggle({ currentView, onViewChange }: SalesViewToggleProps) {
  return (
    <div className="flex rounded-lg border bg-muted p-1">
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          currentView === 'table' && "shadow-sm"
        )}
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Table View</span>
        <span className="sm:hidden">Table</span>
      </Button>
      <Button
        variant={currentView === 'chart' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('chart')}
        className={cn(
          "flex items-center gap-2 transition-all duration-200 ml-1",
          currentView === 'chart' && "shadow-sm"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Chart View</span>
        <span className="sm:hidden">Chart</span>
      </Button>
    </div>
  );
}