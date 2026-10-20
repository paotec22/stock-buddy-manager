import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Command, Sparkles } from "lucide-react";

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const shortcutGroups = [
    {
      category: "Global Navigation (Press G then letter)",
      shortcuts: [
        { key: "G D", description: "Go to Dashboard (Home)" },
        { key: "G I", description: "Open Stock & Inventory" },
        { key: "G S", description: "Open Sales Ledger" },
        { key: "G N", description: "Create New Invoice" },
        { key: "G R", description: "View Business Reports" },
        { key: "G P", description: "Profit & Margin Analysis" },
        { key: "G E", description: "Track Store Expenses" },
        { key: "G U", description: "Customer Directory" },
        { key: "G C", description: "Visual Product Catalogue" },
      ],
    },
    {
      category: "Operational Tools & Actions",
      shortcuts: [
        { key: "⌘ K / Ctrl+K", description: "Open Global Command Center" },
        { key: "B", description: "Open Barcode & SKU Scanner" },
        { key: "?", description: "Show Keyboard Shortcuts Cheatsheet" },
        { key: "Esc", description: "Close any open dialog or modal" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-5 border-border rounded-2xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-xs">
                Navigate the enterprise system at maximum speed with zero mouse clicks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </span>
              <div className="space-y-1.5 bg-muted/30 p-2.5 rounded-xl border border-border/60">
                {group.shortcuts.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1 px-1.5 rounded-md text-xs hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-foreground">{item.description}</span>
                    <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-background border border-border/80 rounded-md shadow-2xs text-muted-foreground">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
