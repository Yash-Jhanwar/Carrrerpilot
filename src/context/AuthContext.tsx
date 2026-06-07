import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  type AuthError,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  loginType: "google" | "guest" | "email";
}

/** Error codes that indicate a popup was blocked by the browser */
const POPUP_BLOCKED_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
]);

/** Error codes that indicate a domain authorization problem */
const DOMAIN_ERRORS = new Set([
  "auth/unauthorized-domain",
  "auth/operation-not-allowed",
]);

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  loginWithGoogle: () => Promise<{ redirecting: boolean }>;
  loginAnonymously: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsInitialized(true);

    if (!auth) {
      console.warn("[Auth] Firebase Auth SDK not available (SSR environment).");
      setLoading(false);
      return;
    }

    console.log("[Auth] Firebase initialized.");

    let unsubscribeAuth: (() => void) | null = null;

    // Set persistence first, then process any redirect result, then start listener
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("[Auth] Persistence set to browserLocalPersistence.");
        // Process redirect result if returning from signInWithRedirect
        return getRedirectResult(auth);
      })
      .then((result) => {
        if (result?.user) {
          console.log("[Auth] Redirect result: Google login successful.", result.user.uid);
          toast.success("Welcome! Signed in with Google.");
        } else {
          console.log("[Auth] No pending redirect result.");
        }
      })
      .catch((err: AuthError) => {
        // Ignore: not on an authorized domain or user cancelled redirect
        if (DOMAIN_ERRORS.has(err.code)) {
          console.warn("[Auth] Redirect result failed — unauthorized domain:", err.code);
        } else {
          console.error("[Auth] Redirect result processing error:", err.code, err.message);
          setError(err.message);
        }
      })
      .finally(() => {
        // Subscribe to auth state changes AFTER redirect result is processed
        unsubscribeAuth = onAuthStateChanged(auth!, (firebaseUser) => {
          if (firebaseUser) {
            let loginType: "google" | "guest" | "email" = "guest";
            if (!firebaseUser.isAnonymous) {
              const providerId = firebaseUser.providerData[0]?.providerId;
              loginType = providerId === "google.com" ? "google" : "email";
            }

            const info: UserInfo = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.isAnonymous
                ? "Guest User"
                : (firebaseUser.displayName ?? null),
              email: firebaseUser.isAnonymous
                ? "guest@careerpilot.ai"
                : (firebaseUser.email ?? null),
              photoURL: firebaseUser.photoURL,
              loginType,
            };

            setUser(info);
            setError(null);
            console.log(`[Auth] Authenticated — UID: ${info.uid}, type: ${info.loginType}`);
          } else {
            console.log("[Auth] User signed out / no session.");
            setUser(null);
          }

          setLoading(false);
        });
      });

    // Cleanup on unmount
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // ── Google Login ────────────────────────────────────────────────────────────

  /**
   * Attempts Google sign-in via popup.
   * If the popup is blocked, automatically falls back to redirect flow.
   *
   * Returns { redirecting: true } when redirect flow is initiated
   * (page will navigate away; caller should not navigate manually).
   */
  const loginWithGoogle = async (): Promise<{ redirecting: boolean }> => {
    if (!auth) {
      toast.error("Firebase Auth is not ready.");
      throw new Error("auth/not-ready");
    }

    setError(null);

    // ── Attempt 1: Popup ──────────────────────────────────────────────────
    try {
      console.log("[Auth] Attempting Google sign-in via popup…");
      await signInWithPopup(auth, googleProvider);
      console.log("[Auth] Popup sign-in succeeded.");
      return { redirecting: false };
    } catch (popupErr: any) {
      const code: string = popupErr?.code ?? "auth/unknown";
      console.warn(`[Auth] Popup failed (${code}). Evaluating fallback…`);

      // If popup was just closed by user — don't auto-redirect, let them retry
      if (code === "auth/popup-closed-by-user") {
        const msg = "Sign-in cancelled. Please try again.";
        setError(msg);
        toast.info(msg);
        throw popupErr;
      }

      // If domain is not authorized — redirect won't help either
      if (DOMAIN_ERRORS.has(code)) {
        const msg = `Domain not authorized for OAuth (${code}). Add this domain in Firebase Console → Authentication → Settings → Authorized Domains.`;
        setError(msg);
        toast.error("Unauthorized domain. See debug panel for details.");
        throw popupErr;
      }

      // If popup was blocked by the browser → auto fallback to redirect
      if (POPUP_BLOCKED_CODES.has(code)) {
        console.log("[Auth] Popup blocked. Falling back to redirect flow…");
        toast.info("Popup blocked — redirecting to Google sign-in…");
      } else {
        // Any other error → still attempt redirect as a best-effort fallback
        console.warn("[Auth] Unexpected popup error. Attempting redirect fallback:", code);
        toast.info("Redirecting to Google sign-in…");
      }

      // ── Attempt 2: Redirect ─────────────────────────────────────────────
      try {
        await signInWithRedirect(auth, googleProvider);
        // signInWithRedirect navigates the page — this line never executes normally
        return { redirecting: true };
      } catch (redirectErr: any) {
        const redirectCode: string = redirectErr?.code ?? "auth/unknown";
        console.error("[Auth] Redirect fallback also failed:", redirectCode);
        setError(redirectErr.message);
        toast.error(`Google sign-in failed: ${redirectCode}`);
        throw redirectErr;
      }
    }
  };

  // ── Anonymous / Guest Login ─────────────────────────────────────────────────

  const loginAnonymously = async (): Promise<void> => {
    if (!auth) {
      toast.error("Firebase Auth is not ready.");
      return;
    }
    setError(null);
    console.log("[Auth] Attempting anonymous sign-in…");
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("[Auth] Anonymous sign-in failed:", err.code);
      setError(err.message);
      toast.error(err.message || "Guest sign-in failed.");
      throw err;
    }
  };

  // ── Email Sign-In ───────────────────────────────────────────────────────────

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    if (!auth) return;
    setError(null);
    console.log("[Auth] Attempting email sign-in…");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("[Auth] Email sign-in failed:", err.code);
      setError(err.message);
      throw err;
    }
  };

  // ── Email Sign-Up ───────────────────────────────────────────────────────────

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> => {
    if (!auth) return;
    setError(null);
    console.log("[Auth] Attempting email registration…");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user && displayName) {
        await updateProfile(result.user, { displayName });
      }
    } catch (err: any) {
      console.error("[Auth] Email registration failed:", err.code);
      setError(err.message);
      throw err;
    }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    if (!auth) return;
    setError(null);
    console.log("[Auth] Signing out…");
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("[Auth] Sign-out failed:", err.code);
      setError(err.message);
      throw err;
    }
  };

  // ── SSR guard ──────────────────────────────────────────────────────────────
  // Before client-side hydration, return context with loading=true

  const contextValue: AuthContextType = {
    user: isInitialized ? user : null,
    loading: isInitialized ? loading : true,
    loginWithGoogle,
    loginAnonymously,
    loginWithEmail,
    signUpWithEmail,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
