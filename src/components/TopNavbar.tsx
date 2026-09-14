import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Users,
  ImageIcon,
  Wrench,
  Search,
  ChevronDown,
  Shield,
  UserCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";
import { CompanyLogo } from "./CompanyLogo";

interface GroupDropdownItemProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  end?: boolean;
  tourId?: string;
  onClick?: () => void;
}

function GroupDropdownItem({
  to,
  icon: Icon,
  title,
  description,
  end,
  tourId,
  onClick,
}: GroupDropdownItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      data-tour={tourId}
      className={({ isActive }) =>
        cn(
          "flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-150 select-none group",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/80 text-foreground"
        )
      }
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors",
          "group-hover:border-primary/40 group-hover:text-primary group-hover:bg-background"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="text-xs font-semibold tracking-tight">{title}</span>
        <span className="text-[11px] text-muted-foreground line-clamp-1">
          {description}
        </span>
      </div>
    </NavLink>
  );
}

function MobileNavItem({
  to,
  icon: Icon,
  children,
  onClick,
  tourId,
  end,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  tourId?: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      data-tour={tourId}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors duration-150 min-h-[42px]",
          isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </NavLink>
  );
}

export function TopNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  const isUploader = userRole === "uploader";

  // Check active module groups
  const isStockActive =
    location.pathname === "/inventory" ||
    location.pathname.startsWith("/inventory/") ||
    location.pathname === "/catalogue";

  const isCommerceActive =
    location.pathname === "/create-invoice" ||
    location.pathname === "/sales" ||
    location.pathname === "/customers" ||
    location.pathname === "/request";

  const isFinancialsActive =
    location.pathname === "/profit-analysis" ||
    location.pathname === "/expenses" ||
    location.pathname === "/reports";

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

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const roleLabel = isAdmin
    ? "Admin"
    : isInventoryManager
    ? "Inventory Manager"
    : isUploader
    ? "Uploader"
    : "Staff";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 print:hidden">
      <div className="flex h-14 items-center px-4 md:px-6 w-full max-w-7xl mx-auto justify-between gap-2">
        {/* Left: Brand / Logo (generic icon as requested) */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/inventory"
            className="flex items-center gap-2.5 group select-none"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
              SI Manager
            </span>
          </NavLink>
        </div>

        {/* Center: Modern Segmented Dropdown Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {/* Stock & Catalog Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 outline-none select-none",
                  isStockActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Stock & Catalog</span>
                <ChevronDown className="h-3 w-3 opacity-70 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-md">
              <GroupDropdownItem
                to="/inventory"
                end
                icon={Package}
                title="Inventory"
                description="Stock counts, pricing & valuation"
                tourId="sidebar-inventory"
              />
              <GroupDropdownItem
                to="/inventory/accessories"
                icon={Wrench}
                title="Accessories (Spares)"
                description="Spare parts & unpriced hardware"
              />
              <GroupDropdownItem
                to="/catalogue"
                icon={ImageIcon}
                title="Product Catalogue"
                description="Visual showroom & customer share link"
                tourId="sidebar-catalogue"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Commerce & Sales Dropdown */}
          {!isInventoryManager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 outline-none select-none",
                    isCommerceActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Commerce</span>
                  <ChevronDown className="h-3 w-3 opacity-70 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-md">
                <GroupDropdownItem
                  to="/create-invoice"
                  icon={FileSpreadsheet}
                  title="Create Invoice"
                  description="Invoicing, receipts & balance tracking"
                />
                <GroupDropdownItem
                  to="/sales"
                  icon={TrendingUp}
                  title="Sales History"
                  description="Logged transactions & daily cash records"
                  tourId="sidebar-sales"
                />
                <GroupDropdownItem
                  to="/customers"
                  icon={Users}
                  title="Customers"
                  description="Client phone directory & order history"
                />
                <GroupDropdownItem
                  to="/request"
                  icon={ClipboardList}
                  title="Stock Requests"
                  description="Branch transfers & requisition queue"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Financials & Reports Dropdown */}
          {!isInventoryManager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 outline-none select-none",
                    isFinancialsActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Financials</span>
                  <ChevronDown className="h-3 w-3 opacity-70 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-md">
                <GroupDropdownItem
                  to="/profit-analysis"
                  icon={PieChart}
                  title="Profit Analysis"
                  description="Gross & net margins, COGS breakdown"
                />
                <GroupDropdownItem
                  to="/expenses"
                  icon={DollarSign}
                  title="Expenses & Installations"
                  description="Operating expenses & installation fees"
                />
                <GroupDropdownItem
                  to="/reports"
                  icon={FileText}
                  title="Business Reports"
                  description="Monthly summaries & analytical KPIs"
                  tourId="sidebar-reports"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Admin Direct Settings Link */}
          {isAdmin && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )
              }
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </NavLink>
          )}
        </nav>

        {/* Right Section: Command Bar + User Dropdown + Theme Switch */}
        <div className="flex items-center gap-2">
          {/* Quick Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs transition-colors shadow-2xs group cursor-pointer"
            title="Search or press Cmd+K"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            <span className="hidden lg:inline font-normal text-xs">Quick Search...</span>
            <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center rounded border border-border bg-card px-1 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openSearch}
            className="sm:hidden h-8 w-8 text-muted-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Direct 1-Click Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Account & Role Dropdown (Desktop) */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border border-border/70 hover:bg-muted/60 transition-colors text-left select-none cursor-pointer"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center">
                    {session.user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[11px] font-medium text-foreground max-w-[100px] truncate">
                      {session.user.email?.split("@")[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {session.user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      variant={isAdmin ? "destructive" : "secondary"}
                      className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold"
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Settings</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Sheet Trigger */}
          <div className="flex md:hidden items-center">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/80">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-2xs">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block leading-none">
                        SI Manager
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {roleLabel}
                  </Badge>
                </div>

                {/* Mobile Navigation Categorized List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {/* Stock Group */}
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Stock & Catalog
                    </span>
                    <MobileNavItem
                      to="/inventory"
                      icon={Package}
                      onClick={closeMobile}
                      tourId="sidebar-inventory"
                      end
                    >
                      Inventory
                    </MobileNavItem>
                    <MobileNavItem
                      to="/inventory/accessories"
                      icon={Wrench}
                      onClick={closeMobile}
                    >
                      Accessories (Spares)
                    </MobileNavItem>
                    <MobileNavItem
                      to="/catalogue"
                      icon={ImageIcon}
                      onClick={closeMobile}
                      tourId="sidebar-catalogue"
                    >
                      Product Catalogue
                    </MobileNavItem>
                  </div>

                  {/* Commerce Group */}
                  {!isInventoryManager && (
                    <div className="space-y-1">
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Commerce & Sales
                      </span>
                      <MobileNavItem
                        to="/create-invoice"
                        icon={FileSpreadsheet}
                        onClick={closeMobile}
                      >
                        Create Invoice
                      </MobileNavItem>
                      <MobileNavItem
                        to="/sales"
                        icon={TrendingUp}
                        onClick={closeMobile}
                        tourId="sidebar-sales"
                      >
                        Sales History
                      </MobileNavItem>
                      <MobileNavItem
                        to="/customers"
                        icon={Users}
                        onClick={closeMobile}
                      >
                        Customers
                      </MobileNavItem>
                      <MobileNavItem
                        to="/request"
                        icon={ClipboardList}
                        onClick={closeMobile}
                      >
                        Stock Requests
                      </MobileNavItem>
                    </div>
                  )}

                  {/* Financials Group */}
                  {!isInventoryManager && (
                    <div className="space-y-1">
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Financials & Reports
                      </span>
                      <MobileNavItem
                        to="/profit-analysis"
                        icon={PieChart}
                        onClick={closeMobile}
                      >
                        Profit Analysis
                      </MobileNavItem>
                      <MobileNavItem
                        to="/expenses"
                        icon={DollarSign}
                        onClick={closeMobile}
                      >
                        Expenses & Installations
                      </MobileNavItem>
                      <MobileNavItem
                        to="/reports"
                        icon={FileText}
                        onClick={closeMobile}
                        tourId="sidebar-reports"
                      >
                        Business Reports
                      </MobileNavItem>
                    </div>
                  )}

                  {/* Settings */}
                  {isAdmin && (
                    <div className="space-y-1">
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        System
                      </span>
                      <MobileNavItem
                        to="/settings"
                        icon={Settings}
                        onClick={closeMobile}
                      >
                        Admin Settings
                      </MobileNavItem>
                    </div>
                  )}
                </div>

                {/* Mobile Drawer Footer */}
                <div className="border-t border-border/80 p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                      {session.user.email}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTheme}
                      className="h-7 px-2 text-xs"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-3.5 w-3.5 text-amber-400 mr-1" />
                      ) : (
                        <Moon className="h-3.5 w-3.5 mr-1" />
                      )}
                      <span>{theme === "dark" ? "Light" : "Dark"}</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      closeMobile();
                      handleSignOut();
                    }}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-9 text-xs font-semibold"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
