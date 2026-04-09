import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Package,
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Settings,
  FileSpreadsheet,
  LogOut,
  Moon,
  Sun,
  ClipboardList,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavItem({ to, icon: Icon, children, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon: Icon, children, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </NavLink>
  );
}

export function TopNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const { data: userRole } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      return profile?.role;
    },
    enabled: !!session?.user?.id,
  });

  if (!session) return null;

  const isInventoryManager = userRole === "inventory_manager";
  const isAdmin = userRole === "admin";

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Failed to sign out");
        return;
      }
      toast.success("Successfully signed out");
      navigate("/");
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Logo */}
        <NavLink to="/inventory" className="flex items-center gap-2 mr-6">
          <img
            src="/Puido_Smart_Solutions.svg"
            alt="SI Manager"
            className="h-8 w-8"
          />
          <span className="font-bold text-lg hidden sm:inline">SI Manager</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <NavItem to="/inventory" icon={Package}>
            Inventory
          </NavItem>
          {!isInventoryManager && (
            <>
              <NavItem to="/sales" icon={TrendingUp}>
                Sales
              </NavItem>
              <NavItem to="/request" icon={ClipboardList}>
                Request
              </NavItem>
              <NavItem to="/expenses" icon={DollarSign}>
                Expenses
              </NavItem>
              <NavItem to="/profit-analysis" icon={PieChart}>
                Profit
              </NavItem>
              <NavItem to="/reports" icon={FileText}>
                Reports
              </NavItem>
              <NavItem to="/create-invoice" icon={FileSpreadsheet}>
                Invoice
              </NavItem>
            </>
          )}
          {isAdmin && (
            <NavItem to="/settings" icon={Settings}>
              Settings
            </NavItem>
          )}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b">
                  <img
                    src="/Puido_Smart_Solutions.svg"
                    alt="SI Manager"
                    className="h-8 w-8"
                  />
                  <span className="font-bold text-lg">SI Manager</span>
                </div>

                {/* Mobile nav items */}
                <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
                  <MobileNavItem to="/inventory" icon={Package} onClick={closeMobile}>
                    Inventory
                  </MobileNavItem>
                  {!isInventoryManager && (
                    <>
                      <MobileNavItem to="/sales" icon={TrendingUp} onClick={closeMobile}>
                        Sales
                      </MobileNavItem>
                      <MobileNavItem to="/request" icon={ClipboardList} onClick={closeMobile}>
                        Request
                      </MobileNavItem>
                      <MobileNavItem to="/expenses" icon={DollarSign} onClick={closeMobile}>
                        Expenses
                      </MobileNavItem>
                      <MobileNavItem to="/profit-analysis" icon={PieChart} onClick={closeMobile}>
                        Profit Analysis
                      </MobileNavItem>
                      <MobileNavItem to="/reports" icon={FileText} onClick={closeMobile}>
                        Reports
                      </MobileNavItem>
                      <MobileNavItem to="/create-invoice" icon={FileSpreadsheet} onClick={closeMobile}>
                        Create Invoice
                      </MobileNavItem>
                    </>
                  )}
                  {isAdmin && (
                    <MobileNavItem to="/settings" icon={Settings} onClick={closeMobile}>
                      Settings
                    </MobileNavItem>
                  )}
                </nav>

                {/* Mobile footer */}
                <div className="border-t p-3">
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobile();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
