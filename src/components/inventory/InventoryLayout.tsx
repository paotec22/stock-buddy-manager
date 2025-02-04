import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface InventoryLayoutProps {
  children: React.ReactNode;
}

export function InventoryLayout({ children }: InventoryLayoutProps) {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Inventory: Checking authentication", { hasSession: !!session?.user });
    if (!session?.user) {
      console.log("Inventory: No session found, redirecting to login");
      navigate('/');
    }
  }, [session, navigate]);

  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}