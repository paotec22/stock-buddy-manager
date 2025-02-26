import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <div className={cn("pb-12 border-r h-full", className)} {...props} />
  );
}

interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  to: string;
}

function SidebarItem({ className, to, children, ...props }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
          isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "",
          className
        )
      }
      {...props}
    >
      {children}
    </NavLink>
  );
}

function SidebarContents() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
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

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Stock Buddy Manager
        </h2>
      </div>
      <div className="space-y-1 px-3">
        <SidebarItem to="/inventory">Inventory</SidebarItem>
        <SidebarItem to="/sales">Sales</SidebarItem>
        <SidebarItem to="/expenses">Expenses</SidebarItem>
        <SidebarItem to="/reports">Reports</SidebarItem>
        <SidebarItem to="/create-invoice">Create Invoice</SidebarItem>
        <SidebarItem to="/settings">Settings</SidebarItem>
      </div>
      <div className="px-3 py-2">
        <ThemeToggle />
      </div>
      <div className="px-3 py-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 font-bold transition-all hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          Logout
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
      <Sidebar className="hidden md:block w-[240px] border-r">
        <SidebarContents />
      </Sidebar>

      {/* Mobile Sidebar */}
      <div className="block md:hidden">
        <Button 
          variant="ghost" 
          size="icon"
          className="fixed top-4 left-4 z-40 bg-background"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-[240px]">
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