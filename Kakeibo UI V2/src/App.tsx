import { useState, useEffect, useCallback } from "react";
import { AppMain } from "./components/AppMain";
import { AuthScreen } from "./components/AuthScreen";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";
import { PINLockScreen } from "./components/PINLockScreen";
import { SettingsView } from "./components/SettingsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./utils/toast";
import { getMe, getAuthToken, removeAuthToken } from "./services/api";
import { Preferences } from "@capacitor/preferences";
import { App as CapacitorApp } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";

/**
 * App Wrapper Component
 * Handles Authentication, PIN Lock, and Lifecycle
 */

export interface SmsExpensePayload {
  amount: number;
  description: string;
  expenseDateTime: string;
  source: "SMS_AUTO";
  referenceId?: string;
  category?: string;
}

/* ===============================
   REGISTER PLUGIN (ONCE)
================================ */
export const SmsReader = registerPlugin<{
  addListener(
    eventName: "onSmsExpenseDetected",
    listenerFunc: (data: SmsExpensePayload) => void,
  ): Promise<{ remove: () => void }>;
  getPendingExpenses(): Promise<{ expenses: SmsExpensePayload[] }>;
  clearPendingExpenses(): Promise<void>;
}>("SmsReader");

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPINEnabled, setIsPINEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [displayScale, setDisplayScale] = useState(1.0);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [pendingSmsExpense, setPendingSmsExpense] =
    useState<SmsExpensePayload | null>(null);

  // ===============================
  // SMS AUTO-DETECT LISTENER (GLOBAL)
  // ===============================
  // Capacitor Plugin Registration
  useEffect(() => {
    const setupListener = async () => {
      const listener = await SmsReader.addListener(
        "onSmsExpenseDetected",
        (data: SmsExpensePayload) => {
          const payload = data as SmsExpensePayload;

          console.log(
            "📩 SMS EVENT RECEIVED IN REACT:",
            JSON.stringify(payload, null, 2),
          );

          // Store it for later UI use
          setPendingSmsExpense(payload);
        },
      );

      return listener;
    };

    let cleanup: { remove: () => void } | null = null;

    setupListener().then((l) => (cleanup = l));

    return () => {
      cleanup?.remove();
    };
  }, []);

  // Deep Link / Routing (Reset Password)
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    if (path === "/reset-password") {
      setResetToken(token || "");
    }
  }, []);

  // Apply Display Scale to root
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-scale",
      displayScale.toString(),
    );
  }, [displayScale]);

  // 1. Initial Preferences & Lifecycle Setup
  useEffect(() => {
    // Listen for App State Changes (Background -> Foreground)
    const listener = CapacitorApp.addListener(
      "appStateChange",
      async ({ isActive }) => {
        if (isActive) {
          console.log("[Lifecycle] App active, re-checking security...");
          const { value: pinEnabled } = await Preferences.get({
            key: "kakeibo_pin_enabled",
          });
          if (pinEnabled === "true") {
            setIsUnlocked(false);
          }
        }
      },
    );

    // Listen for Back Button (Hardware/Gesture)
    const backListener = CapacitorApp.addListener("backButton", (data) => {
      if (showSettings) {
        setShowSettings(false);
      }
      // If we are on the main screen and no modals are open, the default behavior (exit) will happen
      // unless we call data.canGoBack = false (but we want to allow exit from home)
    });

    return () => {
      listener.then((l) => l.remove());
      backListener.then((l) => l.remove());
    };
  }, [showSettings]);

  // 2. Auth & Security Bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Load Dark Mode First
        const { value: darkMode } = await Preferences.get({
          key: "kakeibo_dark_mode",
        });
        setIsDarkMode(darkMode === "true");

        // Load Display Scale
        const { value: scale } = await Preferences.get({
          key: "kakeibo_display_scale",
        });
        if (scale) setDisplayScale(parseFloat(scale));

        const token = await getAuthToken();

        // No token = Definitely not logged in
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // --- STEP A: Instant Recovery from Cache ---
        // Load whatever we have locally first
        const [{ value: pinEnabled }, { value: cachedUser }] =
          await Promise.all([
            Preferences.get({ key: "kakeibo_pin_enabled" }),
            Preferences.get({ key: "user_data" }),
          ]);

        if (cachedUser) setUser(JSON.parse(cachedUser));

        if (pinEnabled === "true") {
          setIsPINEnabled(true);
          setIsUnlocked(false);
        } else {
          setIsPINEnabled(false);
          setIsUnlocked(true);
        }

        // Tell the app "We are probably logged in" immediately
        setIsAuthenticated(true);

        // --- STEP B: Background Identity Verification ---
        try {
          const rawData = await getMe();
          // Normalize (handle nested response or top-level)
          const baseUser = rawData?.user || rawData;
          const userData = {
            ...baseUser,
            name:
              baseUser.name ||
              baseUser.username ||
              baseUser.fullName ||
              baseUser.email ||
              "User",
          };

          setUser(userData);
          await Preferences.set({
            key: "user_data",
            value: JSON.stringify(userData),
          });
        } catch (error: any) {
          const status = error.response?.status;
          console.warn(
            `[Bootstrap] Background Auth Check Failed (Status: ${status}):`,
            error.message,
          );

          // ONLY force logout if the session is definitively UNAUTHORIZED (401)
          // Note: 403 (Forbidden) is often a false positive in Capacitor/CORS scenarios
          if (status === 401) {
            console.error(
              "[Bootstrap] Session is invalid (401). Forcing logout.",
            );
            await removeAuthToken();
            await Preferences.remove({ key: "user_data" });
            setIsAuthenticated(false);
            setUser(null);
          } else {
            console.log(
              `[Bootstrap] Non-critical error (${status}). Trusting local session cache.`,
            );
            // We've already set isAuthenticated(true) in Step A, so we stay here.
          }
        }
      } catch (err) {
        console.error("[Bootstrap] Critical failure during rehydration:", err);
        setIsAuthenticated(false);
      }
    };

    bootstrap();
  }, []);

  const handleAuthSuccess = useCallback(
    async (token: string, userData: any) => {
      // Ensure we have normalized data
      const baseUser = userData?.user || userData;
      const normalizedUser = {
        ...baseUser,
        name:
          baseUser.name ||
          baseUser.username ||
          baseUser.fullName ||
          baseUser.email ||
          "User",
        email:
          baseUser.email ||
          (typeof baseUser === "string" ? "" : baseUser.email),
      };

      setUser(normalizedUser);
      setIsAuthenticated(true);

      // Check if new auth should be locked
      const { value: pinEnabled } = await Preferences.get({
        key: "kakeibo_pin_enabled",
      });
      if (pinEnabled === "true") {
        setIsPINEnabled(true);
        setIsUnlocked(true); // Let them in after successful login
      } else {
        setIsPINEnabled(false);
        setIsUnlocked(true);
      }
    },
    [],
  );

  const handleLogout = async () => {
    await removeAuthToken();
    await Preferences.remove({ key: "user_data" });
    setIsAuthenticated(false);
    setIsUnlocked(false);
    setUser(null);
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleEnablePINLock = async () => {
    setIsPINEnabled(true);
  };

  // Sync Dark Mode with Document Root
  useEffect(() => {
    if (isDarkMode !== null) {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await Preferences.set({
      key: "kakeibo_dark_mode",
      value: newMode.toString(),
    });
  };

  // 1. Loading State
  if (isAuthenticated === null || isDarkMode === null) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-[#007AFF] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <p
            className={`text-[17px] font-medium tracking-tight ${isDarkMode ? "text-white/50" : "text-black/50"}`}
          >
            Kakeibo
          </p>
        </div>
      </div>
    );
  }

  // 1.5. Password Reset Flow
  if (resetToken !== null) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        isDarkMode={isDarkMode ?? false}
        onResetSuccess={() => {
          setResetToken(null);
          // Clear URL so refreshing doesn't show it again
          window.history.replaceState({}, document.title, "/");
        }}
      />
    );
  }

  // 2. Auth Flow
  if (!isAuthenticated) {
    return (
      <AuthScreen onAuthSuccess={handleAuthSuccess} isDarkMode={isDarkMode} />
    );
  }

  // 3. PIN Flow (Enforced even on startup if enabled)
  if (isPINEnabled && !isUnlocked) {
    return <PINLockScreen onUnlock={handleUnlock} isDarkMode={isDarkMode} />;
  }

  // 4. Content Flow
  if (showSettings) {
    return (
      <SettingsView
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
        onEnablePINLock={handleEnablePINLock}
        isPINEnabled={isPINEnabled}
        userName={user?.name || "User"}
        userEmail={user?.email || "user@example.com"}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        displayScale={displayScale}
        onSetDisplayScale={setDisplayScale}
      />
    );
  }

  return (
    <ErrorBoundary>
      <Toaster isDarkMode={isDarkMode} position="top-center" />
      <AppMain
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenSettings={() => setShowSettings(true)}
        pendingSmsExpense={pendingSmsExpense}
        onConsumeSmsExpense={() => setPendingSmsExpense(null)}
      />
    </ErrorBoundary>
  );
}
