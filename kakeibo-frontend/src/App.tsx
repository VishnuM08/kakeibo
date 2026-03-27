import { useState, useEffect, useCallback } from "react";
import { AppMain } from "./components/AppMain";
import { AuthScreen } from "./components/AuthScreen";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";
import { VerifyEmailScreen } from "./components/VerifyEmailScreen";
import { PINLockScreen } from "./components/PINLockScreen";
import { SettingsView } from "./components/SettingsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./utils/toast";
import { getMe, getAuthToken, removeAuthToken } from "./services/api";
import { clearAllLocalData } from "./utils/syncUtils";
import { Preferences } from "@capacitor/preferences";
import { App as CapacitorApp } from "@capacitor/app";
import { registerPlugin, Capacitor } from "@capacitor/core";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { HelpCircle, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { message } from "antd";

const KakeiboNative = registerPlugin<any>('KakeiboNative');

/**
 * App Wrapper Component
 * Handles Authentication, PIN Lock, and Lifecycle
 */

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPINEnabled, setIsPINEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "oled">(
    "light",
  );
  const [user, setUser] = useState<any>(null);
  const [displayScale, setDisplayScale] = useState(1.0);
  const [showSMSDisclosure, setShowSMSDisclosure] = useState(false);

  // Check SMS permission on mount for Android background detection (Global)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    
    const checkPermission = async () => {
      // Small delay to ensure bridge is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        console.log("[SMS] Checking background permission...");
        const { status } = await KakeiboNative.checkSmsPermission();
        if (status !== 'granted') {
          setShowSMSDisclosure(true);
        }
      } catch (e) {
        console.error("[SMS] Permission check failed, falling back to disclosure", e);
        setShowSMSDisclosure(true);
      }
    };
    checkPermission();
  }, []);

  const handleAllowSMS = async () => {
    setShowSMSDisclosure(false);
    try {
      await KakeiboNative.requestSmsPermission();
    } catch (e) {
      console.error("[SMS] Failed to request permission", e);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Deep Link Handling (Capacitor)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupDeepLinks = async () => {
      await CapacitorApp.addListener("appUrlOpen", (data) => {
        console.log("🔗 Deep Link Received:", data.url);
        // Example: com.aignite.kakeibo://reset-password?token=XYZ
        try {
          const url = new URL(data.url);
          const path = url.pathname || "/";
          const search = url.search || "";
          navigate(`${path}${search}`);
        } catch (e) {
          // Fallback if URL parsing fails
          const slug = data.url.split("://").pop();
          if (slug) navigate(`/${slug}`);
        }
      });
    };

    setupDeepLinks();
  }, [navigate]);

  // Apply Display Scale to root
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-scale",
      displayScale.toString(),
    );
    // Apply zoom for WebKit/Blink browsers since hardcoded px bypasses rem scaling
    (document.documentElement.style as any).zoom = displayScale.toString();
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
        // Load Theme Mode First
        const { value: storedTheme } = await Preferences.get({
          key: "kakeibo_theme_mode",
        });
        if (storedTheme) {
          // Force existing 'dark' users to 'oled' for the unified true black theme
          if (storedTheme === "dark") {
             setThemeMode("oled");
          } else {
             setThemeMode(storedTheme as any);
          }
        } else {
          // Compatibility migration: check old dark mode key
          const { value: oldDarkMode } = await Preferences.get({
            key: "kakeibo_dark_mode",
          });
          if (oldDarkMode === "true") {
            setThemeMode("oled");
          } else {
            setThemeMode("light");
          }
        }

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
      // Ensure we have basic normalized data for immediate optimistic UI
      const baseUser = userData?.user || userData;
      const initialUser = {
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

      setUser(initialUser);
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

      // Fetch the full identity payload exactly like bootstrap() does in background
      try {
        const rawData = await getMe();
        const fullBaseUser = rawData?.user || rawData;
        const normalizedUser = {
          ...fullBaseUser,
          name:
            fullBaseUser.name ||
            fullBaseUser.username ||
            fullBaseUser.fullName ||
            fullBaseUser.email ||
            "User",
          email:
            fullBaseUser.email ||
            (typeof fullBaseUser === "string" ? "" : fullBaseUser.email),
        };
        setUser(normalizedUser);
        await Preferences.set({
          key: "user_data",
          value: JSON.stringify(normalizedUser),
        });
      } catch (err) {
        console.error("[Auth] Failed to fetch full user on login:", err);
      }
    },
    [],
  );

  const handleLogout = async () => {
    await removeAuthToken();
    await Preferences.remove({ key: "user_data" });
    clearAllLocalData();
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

  // Helper for existing components that just need to know if it's dark
  const isDark = themeMode !== "light";

  // Sync Theme Mode with Document Root
  useEffect(() => {
    document.documentElement.classList.remove("dark", "oled-mode");
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeMode === "oled") {
      document.documentElement.classList.add("dark", "oled-mode");
    }
  }, [themeMode]);

  const toggleDarkMode = async () => {
    let nextMode: "light" | "dark" | "oled" = "light";
    // Toggle directly to OLED (true black)
    if (themeMode === "light") nextMode = "oled";
    else nextMode = "light";

    setThemeMode(nextMode);
    await Preferences.set({
      key: "kakeibo_theme_mode",
      value: nextMode,
    });
  };

  // Helper for Reset Password Route
  let resetPasswordElement = null;
  if (!isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token") || "";
    resetPasswordElement = (
      <ResetPasswordScreen
        token={token}
        isDarkMode={isDark}
        onResetSuccess={() => {
          navigate("/login", { replace: true });
        }}
      />
    );
  }

  let verifyEmailElement = null;
  if (!isAuthenticated) {
    verifyEmailElement = (
      <VerifyEmailScreen isDarkMode={isDark} themeMode={themeMode} />
    );
  }

  // Main App Content with PIN Guard
  let mainContentElement = null;
  if (isAuthenticated !== null && isAuthenticated !== false) {
    if (isPINEnabled && !isUnlocked) {
      mainContentElement = (
        <PINLockScreen onUnlock={handleUnlock} isDarkMode={isDark} />
      );
    } else {
      mainContentElement = (
        <ErrorBoundary>
          <Toaster isDarkMode={isDark} position="top-center" />
          <AppMain
            isDarkMode={isDark}
            themeMode={themeMode}
            onToggleDarkMode={toggleDarkMode}
            onOpenSettings={() => navigate("/settings")}
          />
        </ErrorBoundary>
      );
    }
  }

  // 1. Loading State
  if (isAuthenticated === null) {
    const isDarkGlobal = themeMode !== "light";
    const bg =
      themeMode === "oled" ? "#000000" : isDarkGlobal ? "#121212" : "#f5f5f7";
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center transition-colors duration-300`}
        style={{ background: bg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-[#007aff] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <p
            className={`text-[17px] font-medium tracking-tight ${isDarkGlobal ? "text-white/50" : "text-black/50"}`}
          >
            Kakeibo
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Auth Flow */}
        {!isAuthenticated ? (
          <>
            <Route
              path="/login"
              element={
                <AuthScreen
                  onAuthSuccess={handleAuthSuccess}
                  isDarkMode={isDark}
                />
              }
            />
            <Route path="/reset-password" element={resetPasswordElement} />
            <Route path="/verify-email" element={verifyEmailElement} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* Main App Routes (all render MainContent which handles modals via URL) */}
            <Route path="/" element={mainContentElement} />
            <Route path="/add-expense" element={mainContentElement} />
            <Route path="/edit-expense/:id" element={mainContentElement} />
            <Route path="/analytics" element={mainContentElement} />
            <Route path="/calendar" element={mainContentElement} />
            <Route path="/savings" element={mainContentElement} />
            <Route path="/recurring" element={mainContentElement} />
            <Route path="/bill-reminders" element={mainContentElement} />
            <Route path="/help" element={mainContentElement} />
            <Route path="/export" element={mainContentElement} />

            <Route path="/budget-settings" element={mainContentElement} />
            <Route path="/search" element={mainContentElement} />

            <Route
              path="/settings"
              element={
                <SettingsView
                  onClose={() => navigate("/")}
                  onLogout={handleLogout}
                  onEnablePINLock={handleEnablePINLock}
                  isPINEnabled={isPINEnabled}
                  userName={user?.name || "User"}
                  userEmail={user?.email || "user@example.com"}
                  isDarkMode={isDark}
                  themeMode={themeMode}
                  onToggleDarkMode={toggleDarkMode}
                  displayScale={displayScale}
                  onSetDisplayScale={setDisplayScale}
                />
              }
            />
            {/* Catch-all for authenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>

      {/* Prominent Disclosure for SMS Permission */}
      <AnimatePresence>
        {showSMSDisclosure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`max-w-md w-full p-8 rounded-[40px] shadow-2xl text-center ${isDark ? "bg-[#1c1c1e] text-white" : "bg-white text-black"}`}
            >
              <div className="w-16 h-16 bg-[#007aff]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-[#007aff]" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Automatic Expense Tracking</h2>
              <p className={`text-[15px] leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Track your finances effortlessly without opening the app for every single purchase.
              </p>

              <div className={`text-left p-5 rounded-[24px] mb-4 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <h3 className="text-[13px] font-bold uppercase tracking-widest mb-2 opacity-50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#007aff] rounded-full"></span>
                  Why we use this?
                </h3>
                <p className="text-[14px] leading-relaxed font-medium">
                  To automatically detect bank transaction alerts (HDFC, SBI, ICICI, etc.) even when the app is closed, ensuring your spendings are recorded in real-time without manual entry.
                </p>
              </div>

              <div className={`text-left p-5 rounded-[24px] mb-8 border ${isDark ? "border-white/10 bg-black/20" : "border-black/5 bg-black/5"}`}>
                <h3 className="text-[13px] font-bold uppercase tracking-widest mb-2 text-[#007aff] flex items-center gap-2">
                  Privacy Disclaimer
                </h3>
                <ul className="text-[13px] leading-relaxed opacity-70 space-y-1">
                  <li>• No cloud storage. All SMS data is processed 100% locally.</li>
                  <li>• Only financial transaction alerts are detected.</li>
                  <li>• Your personal conversations and OTPs are NEVER accessed.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllowSMS}
                  className="w-full py-5 rounded-[20px] bg-[#007aff] text-white font-bold text-[17px] active:scale-95 transition-transform shadow-lg shadow-[#007aff]/20"
                >
                  Confirm & Enable
                </button>
                <button
                  onClick={() => setShowSMSDisclosure(false)}
                  className={`w-full py-4 rounded-[20px] font-semibold text-[17px] active:scale-95 transition-transform ${isDark ? "text-white/40" : "text-black/40"}`}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
