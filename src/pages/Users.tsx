import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Users = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">User Management</h1>
          {/* User management content will be implemented in the next iteration */}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Users;