import { TopNavbar } from "./TopNavbar";
import { useAuth } from "./AuthProvider";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function AppLayout({ children, className, fullWidth }: AppLayoutProps) {
  const { session, loading } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground print:min-h-0 print:bg-white print:text-black">
      <TopNavbar />
      <main className="flex-1 print:flex-none print:w-full">
        <div className={fullWidth ? "" : "px-4 md:px-8 lg:px-16 xl:px-24 py-4 md:py-6 print:p-0 print:m-0 print:w-full print:max-w-none"}>
          {children}
        </div>
      </main>
    </div>
  );
}
