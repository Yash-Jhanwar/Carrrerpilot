import { motion } from "framer-motion";
import { Plane } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-hero-glow opacity-40" />

      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Animated App Logo */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, -6, 6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary glow-ring shadow-xl shadow-primary/20"
        >
          <Plane className="h-8 w-8 text-primary-foreground transform -rotate-12" />
        </motion.div>

        {/* Branding */}
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-display text-2xl font-bold text-slate-900 leading-tight"
          >
            CareerPilot<span className="text-primary"> AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xs text-slate-400 font-medium tracking-tight"
          >
            Your AI Career Growth Partner
          </motion.p>
        </div>

        {/* Loading Spinner & Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center space-y-3"
        >
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute h-6 w-6 rounded-full border-2 border-primary/20" />
            <div className="absolute h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground animate-pulse tracking-wide uppercase">
            Verifying Access
          </span>
        </motion.div>
      </div>
    </div>
  );
}
