import { useState, useEffect, useCallback, useRef } from "react";
import { AppMain } from "./components/AppMain";
import { AuthScreen } from "./components/AuthScreen";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";
import { VerifyEmailScreen } from "./components/VerifyEmailScreen";
import { PINLockScreen } from "./components/PINLockScreen";
import { SettingsView } from "./components/SettingsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./utils/toast";
import { getMe, getAuthToken, setAuthToken, removeAuthToken } from "./services/api";
import { clearAllLocalData } from "./utils/syncUtils";
import { Preferences } from "@capacitor/preferences";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
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
import { KakeiboNative } from "./plugins/KakeiboNative";
import OAuthSuccess from "./components/OAuthSuccess";

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

          if (url.pathname === "/oauth-success") {
            const token = url.searchParams.get("token");

            if (token) {
              console.log("✅ Token received via Deep Link:", token);

              // Use the correct setAuthToken (which uses Preferences)
              // We wrap this in an async call and then reload
              const handleToken = async () => {
                await setAuthToken(token);
                window.location.replace("/");
              };
              handleToken();
              return;
            }
          }
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

  // Keep a fresh reference to the current path for the back listener
  const currentPath = useRef(location.pathname);
  useEffect(() => {
    currentPath.current = location.pathname;
  }, [location.pathname]);

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
    const backListener = CapacitorApp.addListener("backButton", () => {
      // Navigate back if we are on a nested route (e.g., /settings)
      if (currentPath.current !== "/") {
        navigate(-1);
      } else {
        // Exit app if we are on the home screen
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listener.then((l) => l.remove());
      backListener.then((l) => l.remove());
    };
  }, [navigate]);

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
          console.log("[Bootstrap] getMe response:", rawData);
          
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

          console.log("[Bootstrap] Normalized user data:", userData);
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
            user={user}
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
            <Route path="/oauth-success" element={<OAuthSuccess />} />
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
                    userAvatar={user?.picture || user?.avatar}
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
    </>
  );
}
