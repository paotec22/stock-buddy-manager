import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function InventoryLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <main className="overflow-auto bg-background" role="main">
          <div className="p-4">
            <h1 className="sr-only">Inventory - SI Manager</h1>
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout
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
