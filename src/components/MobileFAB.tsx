"use client";

import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FABAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  shortcut?: string;
}

interface MobileFABProps {
  primaryAction: FABAction;
  secondaryActions?: FABAction[];
  position?: "bottom-right" | "bottom-left" | "center";
  tourId?: string;
}

export function MobileFAB({
  primaryAction,
  secondaryActions = [],
  position = "bottom-right",
  tourId,
}: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const primaryActionRef = useRef(primaryAction);
  primaryActionRef.current = primaryAction;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + N for primary action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        primaryActionRef.current?.onClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Desktop: preserve Cmd/Ctrl+Shift+N keyboard shortcut without rendering a stray unfixed '+' button
  if (!isMobile) return null;

  const positionClasses = {
    "bottom-right": "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 md:hidden z-40",
    "bottom-left": "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 md:hidden z-40",
    center: "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 md:hidden z-40",
  };

  return (
    <>
      {isOpen && secondaryActions.length > 0 && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={cn(positionClasses[position], "flex flex-col-reverse items-end gap-2.5")}>
        {/* Secondary actions (speed dial) */}
        {isOpen &&
          secondaryActions.map((action, i) => (
            <Button
              key={i}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              variant="secondary"
              size="default"
              className="flex items-center gap-2 h-11 px-4 rounded-full border border-border shadow-lg bg-card text-foreground hover:bg-muted active:scale-95"
            >
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold whitespace-nowrap">{action.label}</span>
            </Button>
          ))}

        {/* Main FAB */}
        <Button
          onClick={() => {
            if (secondaryActions.length) {
              setIsOpen((prev) => !prev);
            } else {
              primaryAction.onClick();
            }
          }}
          variant="default"
          size="default"
          className={cn(
            "h-13 w-13 rounded-full shadow-lg",
            "transition-transform duration-200 active:scale-95",
            "focus-visible:ring-4 focus-visible:ring-primary/30",
            "bg-primary text-primary-foreground",
            isOpen && secondaryActions.length && "rotate-90"
          )}
          aria-label={secondaryActions.length ? "Toggle quick actions menu" : primaryAction.label}
          aria-expanded={isOpen}
          data-tour={tourId}
        >
          {isOpen && secondaryActions.length ? (
            <X className="h-5 w-5" />
          ) : (
            <primaryAction.icon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </>
  );
}