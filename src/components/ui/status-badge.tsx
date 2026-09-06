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
    sm: "text-[11px] px-2 py-0.5 tracking-tight",
    md: "text-xs px-2.5 py-0.5 tracking-tight font-medium",
    lg: "text-xs px-3 py-1 font-medium"
  };

  const statusConfig = {
    "in-stock": {
      label: "In Stock",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25"
    },
    "low-stock": {
      label: "Low Stock",
      icon: AlertTriangle,
      className: "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25"
    },
    "out-of-stock": {
      label: "Out of Stock",
      icon: XCircle,
      className: "bg-rose-500/10 text-rose-800 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25"
    },
    "normal": {
      label: "Normal",
      icon: Package,
      className: "bg-muted/70 text-muted-foreground border-border/80"
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
