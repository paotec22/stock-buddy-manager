import { TopNavbar } from "./TopNavbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "./AuthProvider";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function AppLayout({ children, className, fullWidth }: AppLayoutProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // If auth is still checking, display a smooth skeleton layout shell
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="h-16 border-b border-border/40 bg-card/60 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
          <div className="h-8 w-36 bg-muted rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded-xl animate-pulse" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-5">
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-24 bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-24 bg-muted/60 rounded-xl animate-pulse" />
          </div>
          <div className="h-72 bg-muted/40 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  // If not logged in, render children without layout (for login page)
  if (!session) {
    return <>{children}</>;
  }

  // On create-invoice, it has its own dedicated mobile quick dock at the bottom
  const isCreateInvoice = location.pathname === "/create-invoice";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground print:min-h-0 print:bg-white print:text-black">
      <TopNavbar />
      <main
        className={cn(
          "flex-1 print:flex-none print:w-full",
          !isCreateInvoice && "pb-18 md:pb-0",
          className
        )}
      >
        <div
          className={
            fullWidth
              ? ""
              : "px-3 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-3 sm:py-4 md:py-6 print:p-0 print:m-0 print:w-full print:max-w-none"
          }
        >
          {children}
        </div>
      </main>
      {!isCreateInvoice && <MobileBottomNav />}
    </div>
  );
}
