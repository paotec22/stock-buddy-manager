
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityLogsTable } from "@/components/reports/ActivityLogsTable";
import { SearchInput } from "@/components/ui/search-input";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h1 className="text-2xl font-bold">Reports</h1>
            <div className="w-full md:w-[250px] mt-2 md:mt-0">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search reports..."
                className="glass-effect"
              />
            </div>
          </div>
          <MonthlyExpensesTable searchTerm={searchTerm} />
          <LocationPerformanceTable searchTerm={searchTerm} />
          <ActivityLogsTable searchTerm={searchTerm} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
