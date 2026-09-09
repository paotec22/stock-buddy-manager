import React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItemSelectorProps {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export function InventoryItemSelector({
  checked,
  indeterminate = false,
  onToggle,
  ariaLabel = "Select item",
  className,
  size = "md",
}: InventoryItemSelectorProps) {
  const isSelected = checked || indeterminate;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={ariaLabel}
      aria-checked={indeterminate ? "mixed" : checked}
      role="checkbox"
      className={cn(
        "group inline-flex items-center justify-center rounded-full cursor-pointer touch-manipulation transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 select-none",
        size === "sm" ? "h-6 w-6" : "h-7 w-7",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-150 border",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          isSelected
            ? "bg-primary border-primary text-primary-foreground shadow-2xs scale-100"
            : "border-border/90 dark:border-border/70 bg-background/60 hover:border-primary/60 hover:bg-primary/5 hover:scale-105 group-hover:border-muted-foreground/60 opacity-60 group-hover:opacity-100"
        )}
      >
        {indeterminate ? (
          <Minus className="h-2.5 w-2.5 stroke-[2.5]" />
        ) : checked ? (
          <Check className="h-2.5 w-2.5 stroke-[2.5]" />
        ) : null}
      </span>
    </button>
  );
}
