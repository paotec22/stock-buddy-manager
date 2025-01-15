import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthProvider";

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
  
  if (!session) {
    return null;
  }

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
        <SidebarItem to="/settings">Settings</SidebarItem>
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
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="fixed top-4 left-4 z-40 bg-background"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
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