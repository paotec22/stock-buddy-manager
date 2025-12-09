import { useBackgroundSync, SyncStatus } from "@/hooks/useBackgroundSync";
import { WifiOff, Wifi, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getSyncMessage = (status: SyncStatus, progress: { total: number; completed: number; failed: number }) => {
  switch (status) {
    case 'syncing':
      return `Syncing changes... (${progress.completed}/${progress.total})`;
    case 'success':
      return 'All changes synced successfully!';
    case 'error':
      return `Sync completed with ${progress.failed} error${progress.failed > 1 ? 's' : ''}`;
    default:
      return 'Back online!';
  }
};

const getSyncIcon = (status: SyncStatus) => {
  switch (status) {
    case 'syncing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
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
  const { isOnline, syncStatus, syncProgress, showBanner } = useBackgroundSync();
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
          </div>
          {syncStatus === 'syncing' && (
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
