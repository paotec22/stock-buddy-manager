import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PageLoader } from "@/components/PageLoader";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { initializeDB } from "@/lib/indexedDB";

// Import the Index page normally to avoid issues with the first page load
import Index from "./pages/Index";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import Chatbot from "@/components/chat/Chatbot";

// Lazy load other pages for better initial load time
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Expenses = lazy(() => import("./pages/Expenses"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const ProfitAnalysis = lazy(() => import("./pages/ProfitAnalysis"));

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Load the Index page without Suspense */}
        <Route path="/" element={<Index />} />
        
        {/* Wrap each lazy-loaded route with its own Suspense */}
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/inventory" element={
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        } />
        <Route path="/sales" element={
          <Suspense fallback={<PageLoader />}>
            <Sales />
          </Suspense>
        } />
        <Route path="/reports" element={
          <Suspense fallback={<PageLoader />}>
            <Reports />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        } />
        <Route path="/expenses" element={
          <Suspense fallback={<PageLoader />}>
            <Expenses />
          </Suspense>
        } />
        <Route path="/create-invoice" element={
          <Suspense fallback={<PageLoader />}>
            <CreateInvoice />
          </Suspense>
        } />
        <Route path="/profit-analysis" element={
          <Suspense fallback={<PageLoader />}>
            <ProfitAnalysis />
          </Suspense>
        } />
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
              <div className="min-h-screen pb-20 md:pb-0">
                <AnimatedRoutes />
              </div>
              <MobileBottomNav />
              <Chatbot />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
