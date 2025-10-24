
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { InstallationsTable } from "@/components/reports/InstallationsTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityLogsTable } from "@/components/reports/ActivityLogsTable";
import { SearchInput } from "@/components/ui/search-input";
import { Card } from "@/components/ui/card";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expensesCollapsed, setExpensesCollapsed] = useState(false);
  const [installationsCollapsed, setInstallationsCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h1 className="text-2xl font-bold">Reports</h1>
            <div className="w-full md:w-[250px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search reports..."
                className="glass-effect"
              />
            </div>
          </div>
          <Card className="card-hover">
            <MonthlyExpensesTable 
              searchTerm={searchTerm} 
              isCollapsed={expensesCollapsed}
              onToggleCollapse={() => setExpensesCollapsed(!expensesCollapsed)}
            />
          </Card>
          <Card className="card-hover">
            <InstallationsTable 
              searchTerm={searchTerm} 
              isCollapsed={installationsCollapsed}
              onToggleCollapse={() => setInstallationsCollapsed(!installationsCollapsed)}
            />
          </Card>
          <Card className="card-hover">
            <LocationPerformanceTable searchTerm={searchTerm} />
          </Card>
          <Card className="card-hover">
            <ActivityLogsTable searchTerm={searchTerm} />
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
