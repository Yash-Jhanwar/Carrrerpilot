import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  Plane,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  AlertTriangle,
  Copy,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { GlassCard } from "@/components/ui-ext/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthLoadingScreen } from "@/components/layout/auth-loading-screen";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const {
    user,
    loading,
    loginWithGoogle,
    loginAnonymously,
    loginWithEmail,
    signUpWithEmail,
  } = useAuth();
  const navigate = useNavigate();

  // Active Tab: "login" or "signup"
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Submitting state
  const [submitting, setSubmitting] = useState<
    "google" | "guest" | "email" | null
  >(null);

  // Environment / Debug state
  const [hostname, setHostname] = useState("");
  const [isLocalNetworkIp, setIsLocalNetworkIp] = useState(false);

  // Google-specific error details
  const [googleAuthError, setGoogleAuthError] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [debugCopied, setDebugCopied] = useState(false);

  // ── Detect environment ───────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      const name = window.location.hostname;
      setHostname(host);

      // Private IP ranges: 192.168.x.x, 10.x.x.x, 172.16–31.x.x
      const localIpRe =
        /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/;
      setIsLocalNetworkIp(localIpRe.test(name));
    }
  }, []);

  // ── Redirect if already authenticated ───────────────────────────────────

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setSubmitting("google");
    setGoogleAuthError(null);

    try {
      const { redirecting } = await loginWithGoogle();
      if (!redirecting) {
        toast.success("Welcome back! Signed in with Google.");
      }
    } catch (err: any) {
      const code: string = err?.code ?? "auth/unknown";
      const message: string = err?.message ?? "An unexpected error occurred.";
      console.error("[Login] Google auth error:", code, message);

      setGoogleAuthError({ code, message });

      if (code === "auth/popup-closed-by-user") {
        toast.info("Google Sign-In cancelled.");
      } else if (code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized for OAuth. See debug info.");
      } else {
        toast.error(`Google Sign-In failed: ${code}`);
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitting("guest");
    try {
      await loginAnonymously();
      toast.success("Welcome! Signed in as Guest.");
    } catch (err: any) {
      console.error("[Login] Guest login error:", err);
      toast.error(err.message || "Guest sign-in failed.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side Validation ─────────────────────────────────────────────
    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    if (activeTab === "signup") {
      if (!displayName.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match. Please check again.");
        return;
      }
    }

    setSubmitting("email");
    try {
      if (activeTab === "signup") {
        await signUpWithEmail(email, password, displayName);
        toast.success("Account created successfully! Welcome to CareerPilot.");
      } else {
        await loginWithEmail(email, password);
        toast.success("Welcome back! Successfully logged in.");
      }
    } catch (err: any) {
      const code: string = err?.code ?? "";
      let friendlyMsg = err.message || "Authentication failed.";

      // Specific Firebase Authentication error code handling
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        friendlyMsg = "Account not found or password incorrect.";
      } else if (code === "auth/wrong-password") {
        friendlyMsg = "Incorrect password. Please try again.";
      } else if (code === "auth/email-already-in-use") {
        friendlyMsg = "An account with this email already exists.";
      } else if (code === "auth/weak-password") {
        friendlyMsg = "Firebase Weak Password: Password should be at least 6 characters.";
      } else if (code === "auth/invalid-email") {
        friendlyMsg = "Please enter a valid email address.";
      }

      toast.error(friendlyMsg);
    } finally {
      setSubmitting(null);
    }
  };

  const handleCopyDebugInfo = async () => {
    if (!googleAuthError) return;
    const text = [
      `Hostname: ${hostname}`,
      `Firebase Project: careerpilot-ai-yash`,
      `Error Code: ${googleAuthError.code}`,
      `Error Message: ${googleAuthError.message}`,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setDebugCopied(true);
      toast.success("Debug info copied to clipboard.");
      setTimeout(() => setDebugCopied(false), 2500);
    } catch {
      toast.error("Could not copy automatically. Please copy the text manually.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-hero-glow opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header branding */}
        <div className="flex flex-col items-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary glow-ring mb-4">
            <Plane className="h-6 w-6 text-primary-foreground transform -rotate-12" />
          </span>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            CareerPilot<span className="text-primary">AI</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Empower your career growth journey
          </p>
        </div>

        <GlassCard glow="primary" className="p-8 shadow-xl">
          {/* Card Title Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
              {activeTab === "login" ? (
                <>
                  <LogIn className="h-5 w-5 text-primary" /> Log In to Account
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-primary" /> Create Account
                </>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "login"
                ? "Enter your credentials to access the dashboard"
                : "Fill out the fields below to sign up"}
            </p>
          </div>

          {/* Local IP Alert warning */}
          {isLocalNetworkIp && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-3.5 text-xs text-amber-600 border border-amber-500/20 leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Local Network IP Detected</p>
                <p className="mt-1">
                  Google login may fail because Firebase restricts OAuth to
                  authorized domains. Access the app via{" "}
                  <strong>localhost</strong> or your deployed domain.
                </p>
              </div>
            </div>
          )}

          {/* Premium Animated Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setGoogleAuthError(null);
              }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all relative cursor-pointer",
                activeTab === "login"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {activeTab === "login" && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white rounded-lg border border-slate-200/80 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Log In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setGoogleAuthError(null);
              }}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all relative cursor-pointer",
                activeTab === "signup"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {activeTab === "signup" && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white rounded-lg border border-slate-200/80 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Sign Up</span>
            </button>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 mb-4">
            {activeTab === "signup" && (
              <div className="space-y-1 animate-fade-in">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 rounded-xl glass border-border focus-visible:ring-primary/50"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl glass border-border focus-visible:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder={activeTab === "signup" ? "Min. 8 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl glass border-border focus-visible:ring-primary/50"
                  required
                  minLength={activeTab === "signup" ? 8 : 6}
                />
              </div>
            </div>

            {activeTab === "signup" && (
              <div className="space-y-1 animate-fade-in">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl glass border-border focus-visible:ring-primary/50"
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting !== null}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 transition-all cursor-pointer mt-2"
            >
              {submitting === "email" ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : activeTab === "signup" ? (
                "Create Account"
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          {/* Social connection divider */}
          <div className="relative flex py-1 items-center mb-5">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Or Connect With
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Social Sign-In buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting !== null}
              variant="outline"
              className="w-full h-11 rounded-xl border border-border bg-transparent text-foreground hover:bg-muted/50 font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
            >
              {submitting === "google" ? (
                <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {isLocalNetworkIp
                ? "Continue with Google (Try Anyway)"
                : "Continue with Google"}
            </Button>

            <Button
              type="button"
              onClick={handleGuestLogin}
              disabled={submitting !== null}
              variant="outline"
              className="w-full h-11 rounded-xl border border-border bg-transparent text-foreground hover:bg-muted/50 font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
            >
              {submitting === "guest" ? (
                <div className="h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              )}
              Continue as Guest
            </Button>
          </div>

          {/* Error display and copying panel */}
          {googleAuthError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-3"
            >
              <div className="flex items-start gap-2.5 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Google Authentication Failed</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">
                    Configuration and error logs for debugging:
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-mono bg-background/60 border border-border rounded-lg p-3 space-y-2.5 text-foreground/90 select-text overflow-x-auto">
                <div>
                  <span className="block text-[9px] uppercase tracking-wide font-bold text-muted-foreground">
                    Hostname
                  </span>
                  <span className="break-all">{hostname}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wide font-bold text-muted-foreground">
                    Firebase Project
                  </span>
                  <span>careerpilot-ai-yash</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wide font-bold text-muted-foreground">
                    Error Code
                  </span>
                  <span className="text-destructive font-semibold break-all">
                    {googleAuthError.code}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wide font-bold text-muted-foreground">
                    Error Message
                  </span>
                  <p className="mt-0.5 leading-relaxed break-all whitespace-pre-wrap">
                    {googleAuthError.message}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCopyDebugInfo}
                size="sm"
                className="w-full h-9 rounded-xl bg-destructive/80 hover:bg-destructive text-destructive-foreground text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                {debugCopied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Debug Info
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Safe/Guest notification */}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-primary/10 p-3 text-xs text-muted-foreground border border-primary/10 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              By signing up, your resume analysis, ATS records, and roadmaps will
              be safely saved and accessible from any device.
            </p>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-slate-400 mt-8">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-slate-600">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline cursor-pointer hover:text-slate-600">
            Privacy Policy
          </span>
          .
        </p>
      </motion.div>
    </div>
  );
}
