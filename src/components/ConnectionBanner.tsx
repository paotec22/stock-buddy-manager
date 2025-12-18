import { useBackgroundSync, SyncStatus } from "@/hooks/useBackgroundSync";
import { WifiOff, Wifi, Loader2, CheckCircle, AlertCircle, RefreshCw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

const getSyncMessage = (status: SyncStatus, progress: { total: number; completed: number; failed: number }) => {
  switch (status) {
    case 'syncing':
      return progress.total > 0 
        ? `Pushing changes... (${progress.completed}/${progress.total})`
        : 'Syncing...';
    case 'pulling':
      return 'Fetching latest data from server...';
    case 'success':
      return 'All data synced successfully!';
    case 'error':
      return progress.failed > 0 
        ? `Sync completed with ${progress.failed} error${progress.failed > 1 ? 's' : ''}`
        : 'Sync failed';
    default:
      return 'Back online!';
  }
};

const getSyncIcon = (status: SyncStatus) => {
  switch (status) {
    case 'syncing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'pulling':
      return <Download className="h-4 w-4 animate-bounce" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Wifi className="h-4 w-4" />;
  }
};

const getSyncBannerClass = (status: SyncStatus) => {
  switch (status) {
    case 'syncing':
    case 'pulling':
      return 'bg-primary text-primary-foreground';
    case 'success':
      return 'bg-success text-success-foreground';
    case 'error':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-success text-success-foreground';
  }
};

export function ConnectionBanner() {
  const { isOnline, syncStatus, syncProgress, showBanner, triggerSync } = useBackgroundSync();
  const isSyncing = syncStatus === 'syncing' || syncStatus === 'pulling';

  return (
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
      {showBanner && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 shadow-lg ${getSyncBannerClass(syncStatus)}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            {getSyncIcon(syncStatus)}
            <span>{getSyncMessage(syncStatus, syncProgress)}</span>
            {syncStatus === 'error' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerSync}
                className="ml-2 h-6 px-2 hover:bg-warning-foreground/20"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
          {isSyncing && syncProgress.total > 0 && (
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-primary-foreground/30"
              initial={{ width: '0%' }}
              animate={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
