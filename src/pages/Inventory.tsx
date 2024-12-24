import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Inventory = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
          {/* Inventory content will be implemented in the next iteration */}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Inventory;