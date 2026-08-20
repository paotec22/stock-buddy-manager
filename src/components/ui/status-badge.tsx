import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Package } from "lucide-react";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "normal";

interface StatusBadgeProps {
  status: StockStatus;
  quantity?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dot";
}

export function StatusBadge({ status, quantity, showIcon = true, size = "md", variant = "default" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5"
  };

  const statusConfig = {
    "in-stock": {
      label: "In Stock",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
    },
    "low-stock": {
      label: "Low Stock",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
    },
    "out-of-stock": {
      label: "Out of Stock",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
    },
    "normal": {
      label: "Normal",
      icon: Package,
      className: "bg-muted text-muted-foreground border-border"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          status === "in-stock" && "bg-emerald-600 dark:bg-emerald-400",
          status === "low-stock" && "bg-amber-500 dark:bg-amber-400",
          status === "out-of-stock" && "bg-rose-600 dark:bg-rose-400",
          status === "normal" && "bg-muted-foreground"
        )}
        title={config.label}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        sizeClasses[size],
        config.className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 flex-shrink-0" />}
      <span className="whitespace-nowrap">{config.label}</span>
      {quantity !== undefined && (
        <span className="font-mono tabular-nums font-semibold">({quantity})</span>
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
