import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useIndexedDBTest } from "@/hooks/useIndexedDBTest";
import { WifiOff, Wifi, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ConnectionBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { runTests, isReady } = useIndexedDBTest();

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3 shadow-lg"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <WifiOff className="h-4 w-4 animate-pulse" />
              <span>You are offline. Changes will sync when reconnected.</span>
            </div>
          </motion.div>
        )}
        {isOnline && wasOffline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-success text-success-foreground px-4 py-3 shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4" />
              <span>Back online! Syncing your changes...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev test button - only in development */}
      {import.meta.env.DEV && (
        <Button
          variant="outline"
          size="sm"
          onClick={runTests}
          disabled={!isReady}
          className="fixed bottom-4 right-4 z-50 gap-2"
        >
          <Database className="h-4 w-4" />
          Test IndexedDB
        </Button>
      )}
    </>
  );
}