"use client";

import { Plus, Menu, X, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

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
        primaryAction.onClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [primaryAction]);

  // Don't render on desktop unless there are secondary actions (for Sheet)
  if (!isMobile && !secondaryActions.length) return null;

  const positionClasses = {
    "bottom-right": "fixed bottom-20 right-4 md:hidden z-40",
    "bottom-left": "fixed bottom-20 left-4 md:hidden z-40",
    center: "fixed bottom-20 left-1/2 -translate-x-1/2 md:hidden z-40",
  };

  // Render as Sheet on desktop for secondary actions, FAB on mobile
  if (!isMobile && secondaryActions.length) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            aria-label="Quick actions"
            data-tour={tourId}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Quick Actions</h3>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <Button
                onClick={() => { primaryAction.onClick(); setIsOpen(false); }}
                className="w-full justify-start gap-3 h-12 text-base"
                variant="default"
              >
                <primaryAction.icon className="h-5 w-5" />
                <span>{primaryAction.label}</span>
                {primaryAction.shortcut && (
                  <kbd className="ml-auto px-2 py-0.5 text-xs bg-muted rounded">
                    {primaryAction.shortcut}
                  </kbd>
                )}
              </Button>
              {secondaryActions.map((action, i) => (
                <Button
                  key={i}
                  onClick={() => { action.onClick(); setIsOpen(false); }}
                  className="w-full justify-start gap-3 h-12 text-base"
                  variant="outline"
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto px-2 py-0.5 text-xs bg-muted rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn(positionClasses[position], "flex flex-col-reverse items-end gap-3")}>
      {/* Secondary actions (speed dial) */}
      {isOpen && secondaryActions.map((action, i) => (
        <SheetClose
          key={i}
          asChild
          style={{ transitionDelay: `${50 * (i + 1)}ms` }}
        >
          <Button
            onClick={action.onClick}
            variant="default"
            size="default"
            className={cn(
              "flex items-center gap-2 h-11 px-4 rounded-full shadow-lg animate-scale-in",
              "origin-bottom-right"
            )}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
          </Button>
        </SheetClose>
      ))}

      {/* Main FAB */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => !secondaryActions.length && primaryAction.onClick()}
            variant="default"
            size="default"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl",
              "transition-all duration-300 hover:scale-105 active:scale-95",
              "focus-visible:ring-4 focus-visible:ring-primary/30",
              "bg-primary text-primary-foreground",
              secondaryActions.length && "rotate-45",
              isOpen && secondaryActions.length && "rotate-90"
            )}
            aria-label={secondaryActions.length ? "Open quick actions" : primaryAction.label}
            aria-expanded={isOpen}
            data-tour={tourId}
          >
            {isOpen && secondaryActions.length ? (
              <X className="h-6 w-6" />
            ) : (
              <primaryAction.icon className="h-6 w-6" />
            )}
          </Button>
        </SheetTrigger>
      </Sheet>
    </div>
  );
}