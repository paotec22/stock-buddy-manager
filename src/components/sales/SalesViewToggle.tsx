import { Button } from "@/components/ui/button";
import { BarChart3, CalendarRange, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export type SalesViewMode = 'transactions' | 'monthly' | 'chart';

interface SalesViewToggleProps {
  currentView: SalesViewMode;
  onViewChange: (view: SalesViewMode) => void;
  className?: string;
}

export function SalesViewToggle({ currentView, onViewChange, className }: SalesViewToggleProps) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border/80 bg-muted/80 p-0.5 sm:p-1 gap-0.5 sm:gap-1 shadow-2xs", className)}>
      <Button
        type="button"
        variant={currentView === 'transactions' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('transactions')}
        className={cn(
          "h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer",
          currentView === 'transactions' 
            ? "bg-background text-foreground shadow-xs font-semibold hover:bg-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        title="View Transactions Ledger"
      >
        <Receipt className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Transactions</span>
        <span className="md:hidden">Ledger</span>
      </Button>

      <Button
        type="button"
        variant={currentView === 'monthly' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('monthly')}
        className={cn(
          "h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer",
          currentView === 'monthly' 
            ? "bg-background text-foreground shadow-xs font-semibold hover:bg-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        title="View Monthly & Branch Summary"
      >
        <CalendarRange className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Monthly Summary</span>
        <span className="md:hidden">Monthly</span>
      </Button>

      <Button
        type="button"
        variant={currentView === 'chart' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('chart')}
        className={cn(
          "h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer",
          currentView === 'chart' 
            ? "bg-background text-foreground shadow-xs font-semibold hover:bg-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        title="View Graphical Analytics & Charts"
      >
        <BarChart3 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Analytics</span>
        <span className="md:hidden">Charts</span>
      </Button>
    </div>
  );
}