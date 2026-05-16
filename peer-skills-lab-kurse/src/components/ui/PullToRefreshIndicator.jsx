import { motion } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

/**
 * Visual indicator shown at the top of a page during pull-to-refresh.
 * pullDistance: current pull in px
 * isRefreshing: whether the refresh is in progress
 * threshold: px required to trigger (default 80)
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 80 }) {
  const progress = Math.min(pullDistance / threshold, 1);
  const triggered = pullDistance >= threshold;

  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="flex items-center justify-center overflow-hidden"
      style={{ height: isRefreshing ? threshold * 0.6 : pullDistance * 0.6 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col items-center gap-1">
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <motion.div
            animate={{ rotate: triggered ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowDown
              className="w-5 h-5 text-primary"
              style={{ opacity: progress }}
            />
          </motion.div>
        )}
        <span className="text-xs text-muted-foreground">
          {isRefreshing ? "Wird aktualisiert…" : triggered ? "Loslassen" : "Zum Aktualisieren ziehen"}
        </span>
      </div>
    </motion.div>
  );
}