import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9uuRjH1-yqBtzf3JBwKH9ub-U79_6mvY",
  authDomain: "careerpilot-ai-yash.firebaseapp.com",
  projectId: "careerpilot-ai-yash",
  storageBucket: "careerpilot-ai-yash.firebasestorage.app",
  messagingSenderId: "422684002217",
  appId: "1:422684002217:web:e2cba328f1698145f966b8",
};

// Initialize Firebase on the client-side only (not during SSR)
const app =
  typeof window !== "undefined"
    ? getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApp()
    : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Configure Google provider with proper scopes
export const googleProvider = (() => {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  // Force account selection every time (prevents auto-select issues)
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
})();
