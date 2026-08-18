"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
  FileSpreadsheet,
  Users,
  DollarSign,
  ClipboardList,
  PieChart,
  ImageIcon,
  TrendingUp,
  Plus,
  Upload,
  Download,
  Eye,
  Sparkles,
  Printer,
  Share2,
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  Palette,
  Keyboard,
  ExternalLink,
} from "lucide-react";

interface CommandAction {
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ElementType;
  action: () => void;
  section?: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Build dynamic command list based on auth state and current page
  const buildCommands = useCallback((): CommandAction[] => {
    if (!session) return [];

    const commands: CommandAction[] = [
      // Navigation
      { label: "Dashboard", description: "Go to dashboard overview", shortcut: "G D", icon: LayoutDashboard, action: () => { navigate("/dashboard"); setOpen(false); }, section: "Navigation", keywords: ["home", "overview", "stats"] },
      { label: "Inventory", description: "Manage stock items", shortcut: "G I", icon: Package, action: () => { navigate("/inventory"); setOpen(false); }, section: "Navigation", keywords: ["stock", "items", "products"] },
      { label: "Catalogue", description: "Visual product catalogue", shortcut: "G C", icon: ImageIcon, action: () => { navigate("/catalogue"); setOpen(false); }, section: "Navigation", keywords: ["products", "gallery", "visual"] },
      { label: "Sales", description: "Record and view sales", shortcut: "G S", icon: ShoppingCart, action: () => { navigate("/sales"); setOpen(false); }, section: "Navigation", keywords: ["sell", "transactions", "revenue"] },
      { label: "Customers", description: "Customer management", shortcut: "G U", icon: Users, action: () => { navigate("/customers"); setOpen(false); }, section: "Navigation", keywords: ["clients", "contacts", "people"] },
      { label: "Reports", description: "Business reports", shortcut: "G R", icon: BarChart3, action: () => { navigate("/reports"); setOpen(false); }, section: "Navigation", keywords: ["analytics", "insights", "data"] },
      { label: "Profit Analysis", description: "Profit & loss breakdown", shortcut: "G P", icon: PieChart, action: () => { navigate("/profit-analysis"); setOpen(false); }, section: "Navigation", keywords: ["profit", "loss", "margin"] },
      { label: "Expenses", description: "Track expenses", shortcut: "G E", icon: DollarSign, action: () => { navigate("/expenses"); setOpen(false); }, section: "Navigation", keywords: ["costs", "spending", "bills"] },
      { label: "Requests", description: "Stock requests", shortcut: "G Q", icon: ClipboardList, action: () => { navigate("/request"); setOpen(false); }, section: "Navigation", keywords: ["requisition", "orders", "pending"] },
      { label: "Create Invoice", description: "Generate new invoice", shortcut: "G N", icon: FileSpreadsheet, action: () => { navigate("/create-invoice"); setOpen(false); }, section: "Navigation", keywords: ["bill", "invoice", "pdf"] },
      { label: "Settings", description: "App settings", shortcut: "G ,", icon: Settings, action: () => { navigate("/settings"); setOpen(false); }, section: "Navigation", keywords: ["preferences", "config", "options"] },

      // Actions
      { label: "Add Inventory Item", description: "Create new stock item", shortcut: "⌘⇧N", icon: Plus, action: () => { /* handled by page FAB */ setOpen(false); }, section: "Actions", keywords: ["new", "create", "item", "product"] },
      { label: "Record Sale", description: "Log a new sale", shortcut: "⌘⇧S", icon: ShoppingCart, action: () => { navigate("/sales"); setOpen(false); }, section: "Actions", keywords: ["sell", "transaction", "revenue"] },
      { label: "Bulk Upload", description: "Import items via CSV", shortcut: "⌘⇧U", icon: Upload, action: () => { /* handled by page FAB */ setOpen(false); }, section: "Actions", keywords: ["import", "csv", "batch"] },
      { label: "Export Data", description: "Download current view", shortcut: "⌘E", icon: Download, action: () => { /* handled by page FAB */ setOpen(false); }, section: "Actions", keywords: ["download", "csv", "excel", "pdf"] },

      // UI
      { label: "Toggle Theme", description: "Switch light/dark mode", shortcut: "⌘⇧T", icon: Palette, action: () => { /* theme toggle */ setOpen(false); }, section: "Interface", keywords: ["dark", "light", "appearance", "mode"] },
      { label: "Show Shortcuts", description: "View all keyboard shortcuts", shortcut: "⌘/", icon: Keyboard, action: () => { /* show help */ setOpen(false); }, section: "Interface", keywords: ["help", "keys", "hotkeys", "commands"] },

      // Account
      { label: "Sign Out", description: "Log out of your account", icon: LogOut, action: () => { signOut(); setOpen(false); }, section: "Account", keywords: ["logout", "exit", "leave"] },
    ];

    return commands;
  }, [navigate, session, signOut]);

  const commands = buildCommands();

  // Group commands by section
  const sections = commands.reduce((acc, cmd) => {
    const section = cmd.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(cmd);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  // Toggle palette with Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput
          ref={inputRef}
          placeholder="Type a command or search..."
          className="text-lg"
        />
        <CommandList className="max-h-[60vh] overflow-auto">
          <CommandEmpty>No commands found.</CommandEmpty>
          {Object.entries(sections).map(([sectionName, items]) => (
            <CommandGroup key={sectionName} className="space-y-1">
              <CommandSeparator>{sectionName}</CommandSeparator>
              {items.map((cmd) => (
                <CommandItem
                  key={cmd.label}
                  onSelect={cmd.action}
                  className="relative"
                >
                  {cmd.icon && <cmd.icon className="mr-2 h-4 w-4" />}
                  <span className="flex-1">
                    {cmd.label}
                    {cmd.description && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {cmd.description}
                      </span>
                    )}
                  </span>
                  {cmd.shortcut && (
                    <CommandShortcut className="text-xs text-muted-foreground">
                      {cmd.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}