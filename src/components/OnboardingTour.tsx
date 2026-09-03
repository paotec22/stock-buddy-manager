"use client";

import { Joyride, EVENTS, STATUS } from "react-joyride";
import { useAuth } from "./AuthProvider";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Package, ShoppingCart, ImageIcon, BarChart3 } from "lucide-react";

export function OnboardingTour() {
  const { session } = useAuth();
  const [runTour, setRunTour] = useState(false);

  const checkTourStatus = useCallback(async () => {
    if (!session) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tour_completed, tour_version")
        .eq("id", user.id)
        .maybeSingle();

      const localCompleted = localStorage.getItem("si-manager-tour-completed");
      const shouldRun = !localCompleted && (!profile?.tour_completed || (profile?.tour_version || 0) < 1);

      if (shouldRun) {
        setTimeout(() => setRunTour(true), 1000);
      }
    } catch (e) {
      console.error("Failed to check tour status:", e);
    }
  }, [session]);

  useEffect(() => {
    checkTourStatus();
  }, [checkTourStatus]);

  const markComplete = useCallback(async () => {
    localStorage.setItem("si-manager-tour-completed", "true");
    setRunTour(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            tour_completed: true,
            tour_version: 1,
          });
      }
    } catch (e) {
      console.error("Failed to save tour completion:", e);
    }
  }, []);

  const handleEvent = useCallback(
    (data: { type: string; status?: string; action?: string }) => {
      if (data.type === EVENTS.TOUR_END || data.status === STATUS.SKIPPED || data.status === STATUS.FINISHED) {
        markComplete();
      }
    },
    [markComplete]
  );

  if (!runTour) return null;

  return (
    <div>
      <Joyride
        run={true}
        continuous={true}
        steps={[
          {
            target: "[data-tour='sidebar-inventory']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Inventory Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  View, edit, and track all your stock items. Use the search bar to filter, click any row to edit inline, and use the status badges to filter by stock level.
                </p>
              </div>
            ),
            placement: "right",
            skipBeacon: true,
          },
          {
            target: "[data-tour='sidebar-sales']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Sales Recording
                </h3>
                <p className="text-sm text-muted-foreground">
                  Record new sales, track payment status, and view revenue trends. Switch between table and chart views for different perspectives.
                </p>
              </div>
            ),
            placement: "right",
            skipBeacon: true,
          },
          {
            target: "[data-tour='sidebar-catalogue']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Visual Catalogue
                </h3>
                <p className="text-sm text-muted-foreground">
                  Browse your products in a beautiful grid with images. Click any card for a quick view with features, pricing, and stock status.
                </p>
              </div>
            ),
            placement: "right",
            skipBeacon: true,
          },
          {
            target: "[data-tour='sidebar-reports']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Reports & Analytics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access profit analysis, expense tracking, and detailed business reports. Export data for accounting or presentations.
                </p>
              </div>
            ),
            placement: "right",
            skipBeacon: true,
          },
          {
            target: "[data-tour='fab']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions (Mobile)
                </h3>
                <p className="text-sm text-muted-foreground">
                  On mobile, tap the floating + button for instant access to add items, bulk upload, and export. Also works with <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘⇧N</kbd> on desktop.
                </p>
              </div>
            ),
            placement: "top",
            skipBeacon: true,
          },
          {
            target: "[data-tour='cmd-palette']",
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Command Palette
                </h3>
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd> (or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd>) anytime to search commands, navigate pages, and run actions without touching the mouse.
                </p>
              </div>
            ),
            placement: "bottom",
            skipBeacon: true,
          },
        ]}
<<<<<<< HEAD
        onEvent={handleEvent}
        options={{
          showProgress: true,
          buttons: ["back", "close", "primary", "skip"],
          primaryColor: "hsl(var(--primary))",
          zIndex: 100,
=======
        run={true}
        continuous={true}
        options={{
          buttons: ["skip", "back", "primary"],
        }}
        onEvent={(event) => {
          if (
            event.type === EVENTS.TOUR_END ||
            event.status === STATUS.SKIPPED ||
            event.status === STATUS.FINISHED
          ) {
            localStorage.setItem(TOUR_COMPLETED_KEY, "true");
            setRunTour(false);
          }
>>>>>>> 6437003ddf90ff5b4211acf3d2d68c70a620b7c1
        }}
        styles={{
          tooltip: {
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
<<<<<<< HEAD
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
=======
            backgroundColor: "hsl(var(--card))",
>>>>>>> 6437003ddf90ff5b4211acf3d2d68c70a620b7c1
          },
        }}
        locale={{
          last: "Finish",
          next: "Next",
          back: "Back",
          skip: "Skip",
          close: "Close",
        }}
      />
    </div>
  );
}

export function OnboardingTrigger() {
  const { session } = useAuth();

  const handleRestart = async () => {
    localStorage.removeItem("si-manager-tour-completed");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .upsert({ id: user.id, tour_completed: false, tour_version: 0 });
      }
    } catch (e) {
      console.error("Failed to reset tour:", e);
    }
  };

  if (!session) return null;

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
      title="Restart onboarding tour"
    >
      <Zap className="h-4 w-4" />
      Restart Tour
    </button>
  );
}