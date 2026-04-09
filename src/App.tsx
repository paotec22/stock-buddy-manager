import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AppLayout } from "@/components/AppLayout";
import { initializeDB } from "@/lib/indexedDB";

// Import all pages directly to ensure they're bundled (needed for offline support)
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";
import CreateInvoice from "./pages/CreateInvoice";
import ProfitAnalysis from "./pages/ProfitAnalysis";
import Request from "./pages/Request";

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
        <Route path="/sales" element={<AppLayout><Sales /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
        <Route path="/create-invoice" element={<AppLayout><CreateInvoice /></AppLayout>} />
        <Route path="/profit-analysis" element={<AppLayout><ProfitAnalysis /></AppLayout>} />
        <Route path="/request" element={<AppLayout><Request /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// Configure React Query for optimal performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      retry: 1, // Limit retry attempts
    },
  },
});

const App = () => {
  // Initialize IndexedDB on app startup
  useEffect(() => {
    initializeDB().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectionBanner />
          <BrowserRouter>
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
