import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, ShieldAlert, X, ChevronUp, ChevronDown, Database, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthDebugPanel() {
  // Only render in Vite development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const { user, loading, error } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Determine current auth status text
  const authState = loading
    ? "Loading"
    : user
    ? "Authenticated"
    : "Unauthenticated";

  const statusColor = loading
    ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
    : user
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <AnimatePresence initial={false}>
        {!isOpen ? (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex h-12 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <Shield className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>Auth Debug</span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-80 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold tracking-tight text-slate-100">Dev Auth Panel</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Info grid */}
            <div className="space-y-2.5 text-[11px] font-mono">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Firebase Project:</span>
                <span className="text-slate-100 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  careerpilot-ai-yash
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Auth State:</span>
                <span className={`px-2 py-0.5 rounded border font-semibold ${statusColor}`}>
                  {authState}
                </span>
              </div>

              <div className="flex flex-col gap-1 py-1 border-t border-slate-900 mt-2 pt-2">
                <span className="text-slate-400">User UID:</span>
                <span className="text-indigo-300 bg-slate-900 p-1.5 rounded truncate select-all">
                  {user?.uid || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Login Type:</span>
                <span className="text-slate-100 bg-slate-900 px-2 py-0.5 rounded capitalize">
                  {user?.loginType || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">User Email:</span>
                <span className="text-slate-100 bg-slate-900 px-2 py-0.5 rounded truncate max-w-[150px]">
                  {user?.email || "N/A"}
                </span>
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 text-[10px]">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-slate-900 pt-3 text-center">
              <span className="text-[9px] text-slate-500">
                Visible only on localhost (development server)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
