import { TopNavbar } from "./TopNavbar";
import { useAuth } from "./AuthProvider";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function AppLayout({ children, className, fullWidth }: AppLayoutProps) {
  const { session } = useAuth();

  // If not logged in, render children without layout (for login page)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNavbar />
      <main className={fullWidth ? "flex-1" : "flex-1"}>
        <div className={fullWidth ? "" : "container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl"}>
          {children}
        </div>
      </main>
    </div>
  );
}
