import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect, useState, lazy, Suspense } from "react";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AppLayout } from "@/components/AppLayout";
import { PageLoader } from "@/components/PageLoader";
import { initializeDB } from "@/lib/indexedDB";

// Lazy-loaded non-critical overlays/tools to keep initial bundle lean
const CommandPalette = lazy(() =>
  import("@/components/CommandPalette").then((m) => ({ default: m.CommandPalette }))
);
const KeyboardShortcutsModal = lazy(() =>
  import("@/components/KeyboardShortcutsModal").then((m) => ({ default: m.KeyboardShortcutsModal }))
);
const OnboardingTour = lazy(() =>
  import("@/components/OnboardingTour").then((m) => ({ default: m.OnboardingTour }))
);
const SystemSpeedHealthModal = lazy(() =>
  import("@/components/dashboard/SystemSpeedHealthModal").then((m) => ({ default: m.SystemSpeedHealthModal }))
);

// Lazy-loaded routes for ultra-fast initial bundle and speed optimization
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Expenses = lazy(() => import("./pages/Expenses"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const ProfitAnalysis = lazy(() => import("./pages/ProfitAnalysis"));
const Request = lazy(() => import("./pages/Request"));
const Customers = lazy(() => import("./pages/Customers"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const PublicCatalogue = lazy(() => import("./pages/PublicCatalogue"));
const Accessories = lazy(() => import("./pages/Accessories"));
const Reconciliation = lazy(() => import("./pages/Reconciliation"));
const Purchases = lazy(() => import("./pages/Purchases"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const MarketingAgent = lazy(() => import("./pages/MarketingAgent"));

function DeferredGlobalUtilities() {
  const [commandLoaded, setCommandLoaded] = useState(false);
  const [shortcutsLoaded, setShortcutsLoaded] = useState(false);
  const [speedHealthLoaded, setSpeedHealthLoaded] = useState(false);
  const [shouldLoadTour] = useState(() => {
    try {
      return localStorage.getItem("si-manager-tour-completed") !== "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandLoaded(true);
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        });
        return;
      }

      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setShortcutsLoaded(true);
      }
    };

    const handleOpenCmd = () => setCommandLoaded(true);
    const handleOpenSpeed = () => {
      if (!speedHealthLoaded) {
        setSpeedHealthLoaded(true);
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent("open-speed-health-modal"));
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenCmd);
    window.addEventListener("open-speed-health-modal", handleOpenSpeed);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenCmd);
      window.removeEventListener("open-speed-health-modal", handleOpenSpeed);
    };
  }, [speedHealthLoaded]);

  return (
    <Suspense fallback={null}>
      {commandLoaded && <CommandPalette />}
      {shortcutsLoaded && <KeyboardShortcutsModal />}
      {shouldLoadTour && <OnboardingTour />}
      {speedHealthLoaded && <SystemSpeedHealthModal />}
    </Suspense>
  );
}

function RootLandingRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  return session?.user ? (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ) : (
    <Index />
  );
}

function AppRoutes() {
  // Background prefetch high-frequency pages only after browser is idle and authenticated UI settled
  useEffect(() => {
    const prefetchKeyPages = () => {
      import("./pages/Dashboard");
      import("./pages/Inventory");
      import("./pages/Sales");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        prefetchKeyPages,
        { timeout: 4000 }
      );
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    } else {
      const timer = setTimeout(prefetchKeyPages, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<RootLandingRoute />} />
        <Route path="/login" element={<Index />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
        <Route path="/inventory/accessories" element={<AppLayout><Accessories /></AppLayout>} />
        <Route path="/accessories" element={<Navigate to="/inventory/accessories" replace />} />
        <Route path="/sales" element={<AppLayout><Sales /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
        <Route path="/create-invoice" element={<AppLayout><CreateInvoice /></AppLayout>} />
        <Route path="/profit-analysis" element={<AppLayout><ProfitAnalysis /></AppLayout>} />
        <Route path="/request" element={<AppLayout><Request /></AppLayout>} />
        <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
        <Route path="/reconciliation" element={<AppLayout><Reconciliation /></AppLayout>} />
        <Route path="/purchases" element={<AppLayout><Purchases /></AppLayout>} />
        <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
        <Route path="/catalogue" element={<AppLayout><Catalogue /></AppLayout>} />
        <Route path="/marketing" element={<AppLayout><MarketingAgent /></AppLayout>} />
        <Route path="/share/catalogue" element={<PublicCatalogue />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// Configure React Query with optimal caching, stale times & background revalidation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists in memory for 30 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches on tab switch
      refetchOnReconnect: true, // Auto-sync when internet reconnects
      retry: 1, // Fast failure recovery
    },
  },
});

const App = () => {
  // Initialize IndexedDB on app startup for offline persistence
  useEffect(() => {
    initializeDB().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ConnectionBanner />
            <AuthProvider>
              <DeferredGlobalUtilities />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
