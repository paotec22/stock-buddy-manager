import { NavLink } from "react-router-dom";
import { Boxes, ShoppingCart, Receipt, BarChart3, Settings } from "lucide-react";

export function MobileBottomNav() {
  return (
    <nav aria-label="Primary" className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="grid grid-cols-5">
        <li>
          <NavLink to="/inventory" end className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
          } aria-label="Inventory">
            <Boxes className="h-5 w-5" />
            <span>Inventory</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/sales" className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
          } aria-label="Sales">
            <ShoppingCart className="h-5 w-5" />
            <span>Sales</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/create-invoice" className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
          } aria-label="Invoice">
            <Receipt className="h-5 w-5" />
            <span>Invoice</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
          } aria-label="Reports">
            <BarChart3 className="h-5 w-5" />
            <span>Reports</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
          } aria-label="Settings">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
      <div className="h-safe-bottom" aria-hidden="true" />
    </nav>
  );
}
