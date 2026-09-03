import { NavLink } from "react-router-dom";
import { Boxes, ShoppingCart, Receipt, BarChart3, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/inventory", label: "Stock", icon: Boxes, end: true },
  { to: "/sales", label: "Sales", icon: ShoppingCart, end: false },
  { to: "/expenses", label: "Expenses", icon: Wallet, end: false },
  { to: "/create-invoice", label: "Invoice", icon: Receipt, end: false },
  { to: "/reports", label: "Reports", icon: BarChart3, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export function MobileBottomNav() {
  return (
    <nav 
      aria-label="Primary Mobile Navigation" 
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul className="grid grid-cols-6 h-14 items-center">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="h-full">
            <NavLink 
              to={to} 
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center h-full w-full gap-0.5 text-[10px] font-medium transition-colors select-none",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground hover:text-foreground active:text-primary"
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "relative flex items-center justify-center p-1 rounded-md transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className="truncate max-w-[52px] leading-tight">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
