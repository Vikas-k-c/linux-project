import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";

export function NotificationToast({ log }) {
  return (
    <AnimatePresence>
      {log && (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: 40, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-emerald-300/30 bg-slate-950/95 p-4 shadow-emerald backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <Bell className="mt-1 text-emerald-300" size={18} />
            <div>
              <p className="font-mono text-sm text-emerald-100">New syscall captured</p>
              <p className="mt-1 text-sm text-slate-400">
                {log.process} called <span className="text-cyan-200">{log.syscall}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

