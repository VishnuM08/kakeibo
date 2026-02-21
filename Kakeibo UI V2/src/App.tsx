import { useState, useEffect, useCallback } from "react";
import { AppMain } from "./components/AppMain";
import { AuthScreen } from "./components/AuthScreen";
import { PINLockScreen } from "./components/PINLockScreen";
import { SettingsView } from "./components/SettingsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./utils/toast";
import { getMe, getAuthToken, removeAuthToken } from "./services/api";
import { Preferences } from "@capacitor/preferences";
import { App as CapacitorApp } from "@capacitor/app";

/**
 * App Wrapper Component
 * Handles Authentication, PIN Lock, and Lifecycle
 */

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPINEnabled, setIsPINEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

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

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  // 2. Auth & Security Bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Load Dark Mode First
        const { value: darkMode } = await Preferences.get({
          key: "kakeibo_dark_mode",
        });
        setIsDarkMode(darkMode === "true");

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
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F5F7]">
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
      />
    </ErrorBoundary>
  );
}
