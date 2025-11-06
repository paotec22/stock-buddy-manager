
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Sun
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <div className={cn("pb-12 border-r h-full", className)} {...props} />
  );
}

interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  to: string;
  icon: React.ElementType;
}

function SidebarItem({ className, to, icon: Icon, children, ...props }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-sm",
          className
        )
      }
      {...props}
    >
      <Icon className={cn(
        "h-5 w-5 transition-transform duration-200",
        "group-hover:scale-110"
      )} />
      <span>{children}</span>
    </NavLink>
  );
}

function SidebarContents() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Get user role
  const { data: userRole } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      return profile?.role;
    },
    enabled: !!session?.user?.id
  });
  
  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      console.log("Attempting to sign out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Failed to sign out");
        return;
      }
      console.log("Successfully signed out");
      toast.success("Successfully signed out");
      navigate('/');
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Define which pages each role can access
  const isInventoryManager = userRole === 'inventory_manager';
  const isAdmin = userRole === 'admin';
  const isUploader = userRole === 'uploader';

  return (
    <div className="flex flex-col h-full">
      {/* Header with branding */}
      <div className="px-3 py-6 border-b">
        <div className="flex items-center gap-3 px-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">SI Manager</h2>
            <p className="text-xs text-muted-foreground">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-2 py-4 px-3">
        <SidebarItem to="/inventory" icon={Package}>
          Inventory
        </SidebarItem>
        {!isInventoryManager && (
          <>
            <SidebarItem to="/sales" icon={TrendingUp}>
              Sales
            </SidebarItem>
            <SidebarItem to="/expenses" icon={DollarSign}>
              Expenses
            </SidebarItem>
            <SidebarItem to="/profit-analysis" icon={PieChart}>
              Profit Analysis
            </SidebarItem>
            <SidebarItem to="/reports" icon={FileText}>
              Reports
            </SidebarItem>
            <SidebarItem to="/create-invoice" icon={FileSpreadsheet}>
              Create Invoice
            </SidebarItem>
          </>
        )}
        {isAdmin && (
          <SidebarItem to="/settings" icon={Settings}>
            Settings
          </SidebarItem>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-3 py-4 space-y-2">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-muted/60 hover:shadow-sm"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-5 w-5" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Logout button */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:block w-[260px] border-r shadow-sm bg-sidebar">
        <SidebarContents />
      </Sidebar>

      {/* Mobile Sidebar */}
      <div className="block md:hidden">
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Open navigation menu"
          className="fixed top-4 left-4 z-40 bg-background shadow-md hover-scale"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-[260px]">
            <Sidebar>
              <SidebarContents />
            </Sidebar>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default AppSidebar;
