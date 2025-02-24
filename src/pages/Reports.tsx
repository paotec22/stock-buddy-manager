
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthlyExpensesTable } from "@/components/reports/MonthlyExpensesTable";
import { LocationPerformanceTable } from "@/components/reports/LocationPerformanceTable";
import { ActivityLogsTable } from "@/components/reports/ActivityLogsTable";

const Reports = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <MonthlyExpensesTable />
          <LocationPerformanceTable />
          <ActivityLogsTable />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
