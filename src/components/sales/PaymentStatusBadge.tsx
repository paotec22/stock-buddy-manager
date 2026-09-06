import { PaymentStatus } from "./types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = {
    paid: {
      label: "Paid",
      icon: CheckCircle2,
      style: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400 dark:border-emerald-500/30",
    },
    part_paid: {
      label: "Part Paid",
      icon: Clock,
      style: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400 dark:border-amber-500/30",
    },
    unpaid: {
      label: "Unpaid",
      icon: AlertCircle,
      style: "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400 dark:border-rose-500/30",
    },
  };

  const c = config[status] || config.paid;
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums whitespace-nowrap transition-colors",
        c.style,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{c.label}</span>
    </span>
  );
}

