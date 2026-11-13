import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Boxes, ShoppingCart, Receipt, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/inventory", label: "Stock", icon: Boxes, end: true },
  { to: "/sales", label: "Sales", icon: ShoppingCart, end: false },
  { to: "/create-invoice", label: "Invoice", icon: Receipt, end: false },
  { to: "/reports", label: "Reports", icon: BarChart3, end: false },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul className="grid grid-cols-5 h-15 items-center px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const isDashboard = to === "/";
          const isItemActive = isDashboard
            ? location.pathname === "/" || location.pathname === "/dashboard"
            : undefined;

          return (
            <li key={to} className="h-full">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => {
                  const active = isItemActive !== undefined ? isItemActive : isActive;
                  return cn(
                    "relative flex flex-col items-center justify-center h-full min-h-[44px] w-full gap-0.5 text-[11px] font-medium transition-colors select-none",
                    active
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground active:text-primary"
                  );
                }}
                aria-label={label}
              >
                {({ isActive }) => {
                  const active = isItemActive !== undefined ? isItemActive : isActive;
                  return (
                    <>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                        />
                      )}
                      <div
                        className={cn(
                          "flex items-center justify-center px-3 py-1 rounded-full transition-colors",
                          active && "bg-primary/10"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px]",
                            active ? "text-primary stroke-[2.25]" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <span className="truncate max-w-[64px] leading-tight">{label}</span>
                    </>
                  );
                }}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
