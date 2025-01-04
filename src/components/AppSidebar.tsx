import {
  Box,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";

const menuItems = [
  { title: "Inventory", icon: Box, path: "/inventory" },
  { title: "Sales", icon: BarChart3, path: "/sales" },
  { title: "Reports", icon: FileText, path: "/reports" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    // TODO: Implement logout functionality
    navigate("/");
  };

  return (
    <>
      {isMobile && (
        <div className="fixed top-0 left-0 w-full bg-background border-b z-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <h1 className="text-lg font-semibold">Stock Management</h1>
          </div>
        </div>
      )}
      <Sidebar className={isMobile ? "pt-14" : ""}>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}