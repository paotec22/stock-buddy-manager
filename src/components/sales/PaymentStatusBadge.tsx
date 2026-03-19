import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "./types";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = {
    paid: { label: "Paid", variant: "default" as const, className: "bg-green-600 hover:bg-green-700 text-white" },
    unpaid: { label: "Unpaid", variant: "destructive" as const, className: "" },
    part_paid: { label: "Part Paid", variant: "outline" as const, className: "border-yellow-500 text-yellow-600 dark:text-yellow-400" },
  };

  const c = config[status] || config.paid;

  return (
    <Badge variant={c.variant} className={`${c.className} ${className || ''}`}>
      {c.label}
    </Badge>
  );
}
