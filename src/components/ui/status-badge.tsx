import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Package } from "lucide-react";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "normal";

interface StatusBadgeProps {
  status: StockStatus;
  quantity?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, quantity, showIcon = true, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const statusConfig = {
    "in-stock": {
      label: "In Stock",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20 hover:bg-success/20"
    },
    "low-stock": {
      label: "Low Stock",
      icon: AlertTriangle,
      className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
    },
    "out-of-stock": {
      label: "Out of Stock",
      icon: XCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
    },
    "normal": {
      label: "Normal",
      icon: Package,
      className: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200",
        sizeClasses[size],
        config.className,
        "animate-scale-in"
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{config.label}</span>
      {quantity !== undefined && (
        <span className="font-semibold">({quantity})</span>
      )}
    </span>
  );
}

// Helper function to determine stock status
export function getStockStatus(quantity: number, lowStockThreshold = 10): StockStatus {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= lowStockThreshold) return "low-stock";
  return "in-stock";
}
