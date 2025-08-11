import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";


export function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background" role="main">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
            <h1 className="sr-only">Inventory - SI Manager</h1>
            {children}
          </div>
          
        </main>
      </div>
    </SidebarProvider>
  );
}
