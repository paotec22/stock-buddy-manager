import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AppLayout } from "@/components/AppLayout";
import { PageLoader } from "@/components/PageLoader";
import { initializeDB } from "@/lib/indexedDB";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SystemSpeedHealthModal } from "@/components/dashboard/SystemSpeedHealthModal";

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

// Animated Routes Component with Suspense Fallback
function AnimatedRoutes() {
  const location = useLocation();

  // Background prefetch high-frequency pages during browser idle time
  useEffect(() => {
    const prefetchKeyPages = () => {
      import("./pages/Dashboard");
      import("./pages/Inventory");
      import("./pages/Sales");
      import("./pages/CreateInvoice");
      import("./pages/Reports");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        prefetchKeyPages,
        { timeout: 3000 }
      );
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    } else {
      const timer = setTimeout(prefetchKeyPages, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
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
          <Route path="/share/catalogue" element={<PublicCatalogue />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
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
            <CommandPalette />
            <KeyboardShortcutsModal />
            <OnboardingTour />
            <SystemSpeedHealthModal />
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
