import {
  Box,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Receipt,
  FileInvoice,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useMemo } from "react";

export function AppSidebar() {
  const navigate = useNavigate();

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => [
    { title: "Inventory", icon: Box, path: "/inventory" },
    { title: "Sales", icon: BarChart3, path: "/sales" },
    { title: "Create Invoice", icon: FileInvoice, path: "/create-invoice" },
    { title: "Expenses", icon: Receipt, path: "/expenses" },
    { title: "Reports", icon: FileText, path: "/reports" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ], []);

  const handleLogout = () => {
    // TODO: Implement logout functionality
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Stock Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => navigate(item.path)}>
                    <button className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ThemeToggle />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}