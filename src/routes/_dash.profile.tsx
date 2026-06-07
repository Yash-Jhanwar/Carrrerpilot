import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui-ext/page-header";
import { GlassCard } from "@/components/ui-ext/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Key,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_dash/profile")({
  head: () => ({ meta: [{ title: "My Profile — CareerPilot AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  const getProviderBadgeColor = (type: string) => {
    switch (type) {
      case "google":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "email":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "guest":
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  return (
    <>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account details and authentication preferences."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-1"
        >
          <GlassCard className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border shadow-md">
                {user?.photoURL && (
                  <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
                )}
                <AvatarFallback className="bg-gradient-primary text-2xl font-bold text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                {user?.displayName || "Guest User"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {user?.email || "guest@careerpilot.ai"}
              </p>
            </div>

            <Badge
              variant="outline"
              className={`capitalize text-xs font-semibold px-2.5 py-1 ${getProviderBadgeColor(
                user?.loginType || "guest",
              )}`}
            >
              {user?.loginType || "Guest"} Account
            </Badge>

            <div className="w-full border-t border-border pt-4 text-left space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <span>UID: <code className="bg-muted px-1 rounded break-all">{user?.uid}</code></span>
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Profile Details Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:col-span-2"
        >
          <GlassCard className="p-6 space-y-6">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-border pb-3">
              Account Information
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Full Name
                </span>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{user?.displayName || "Guest User"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </span>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{user?.email || "guest@careerpilot.ai"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Provider Method
                </span>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 text-sm">
                  <Key className="h-4 w-4 text-slate-400" />
                  <span className="capitalize">{user?.loginType || "Guest Login"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Status
                </span>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 text-slate-800 text-sm">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Verified Active</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-xs text-blue-600 flex items-start gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sync Account Activity</p>
                <p className="mt-0.5 leading-relaxed opacity-90">
                  Your profile details are synced automatically with Firebase Authentication and Firestore to preserve your career metrics.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
