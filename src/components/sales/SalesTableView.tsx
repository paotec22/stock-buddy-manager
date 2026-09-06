import { useState } from "react";
import { SalesTable } from "./SalesTable";
import { SalesSummaryTable } from "./SalesSummaryTable";
import { Sale } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CalendarRange } from "lucide-react";

interface SalesTableViewProps {
  sales: Sale[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function SalesTableView({ sales, hasFilters = false, onClearFilters }: SalesTableViewProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "monthly">("transactions");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "transactions" | "monthly")} className="w-full">
        <div className="flex items-center justify-between gap-3 mb-3">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex h-9 p-1 bg-muted/60 border border-border">
            <TabsTrigger
              value="transactions"
              className="flex items-center justify-center gap-1.5 text-xs font-medium px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-0"
            >
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">All </span>Transactions ({sales.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="flex items-center justify-center gap-1.5 text-xs font-medium px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-0"
            >
              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Monthly & Branch </span>Summary
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transactions" className="mt-0 space-y-4">
          <SalesTable 
            sales={sales} 
            hasFilters={hasFilters} 
            onClearFilters={onClearFilters} 
          />
        </TabsContent>

        <TabsContent value="monthly" className="mt-0">
          <SalesSummaryTable sales={sales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
