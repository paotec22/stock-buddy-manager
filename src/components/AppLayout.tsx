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
      <main className="flex-1">
        <div className={fullWidth ? "" : "px-4 md:px-8 lg:px-16 xl:px-24 py-4 md:py-6"}>
          {children}
        </div>
      </main>
    </div>
  );
}
