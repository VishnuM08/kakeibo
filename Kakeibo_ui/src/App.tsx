import { useState, useEffect } from "react";
import { AppMain } from "./components/AppMain";
import { AuthScreen } from "./components/AuthScreen";
import { PINLockScreen } from "./components/PINLockScreen";
import { SettingsView } from "./components/SettingsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./utils/toast";
import { getMe } from "./services/api";

/**
 * App Wrapper Component
 * Handles Authentication, PIN Lock, and Settings Flow
 *
 * FLOW:
 * 1. Check if user is logged in (JWT token exists)
 * 2. If not logged in -> Show AuthScreen
 * 3. If logged in & PIN enabled -> Show PINLockScreen
 * 4. If authenticated -> Show Main App
 *
 * BACKEND INTEGRATION:
 * - On mount, check JWT token validity
 * - If token expired, show login
 * - Fetch user profile data
 *
 * SECURITY FEATURES:
 * - JWT token validation
 * - PIN lock protection
 * - Auto-logout on token expiry
 * - Session management
 *
 * ERROR HANDLING:
 * - Error boundary catches all component errors
 * - Toast notifications for user feedback
 * - Graceful error recovery
 */

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPINEnabled, setIsPINEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("kakeibo_dark_mode");
    return stored === "true";
  });
  const [user, setUser] = useState<any>(null);

  /*
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      // TODO: BACKEND INTEGRATION - Verify token is still valid
      // const isValid = await verifyToken(token);
      // if (!isValid) {
      //   localStorage.removeItem('jwt_token');
      //   localStorage.removeItem('user_data');
      //   return;
      // }
      
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      
      // Check if PIN lock is enabled
      const pinEnabled = localStorage.getItem('kakeibo_pin_enabled');
      if (pinEnabled === 'true') {
        setIsPINEnabled(true);
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }
    }
    
    // Load dark mode preference
    const darkMode = localStorage.getItem('kakeibo_dark_mode');
    if (darkMode) {
      setIsDarkMode(darkMode === 'true');
    }
  }, []);
*/
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");

    if (!token) return;

    (async () => {
      try {
        const user = await getMe();
        setUser(user);
        setIsAuthenticated(true);

        const pinEnabled = localStorage.getItem("kakeibo_pin_enabled");
        if (pinEnabled === "true") {
          setIsPINEnabled(true);
          setIsUnlocked(false);
        } else {
          setIsUnlocked(true);
        }
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user_data");
        setIsAuthenticated(false);
        setUser(null);
      }
    })();

    const darkMode = localStorage.getItem("kakeibo_dark_mode");
    if (darkMode) {
      setIsDarkMode(darkMode === "true");
    }
  }, []);

  /*
  const handleAuthSuccess = (token: string, userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsUnlocked(true);
  };


  */

  const handleAuthSuccess = (token: string) => {
    setIsAuthenticated(true);
    setIsUnlocked(true);
  };
  /*
  const handleLogout = () => {
    // TODO: BACKEND INTEGRATION - Call logout API
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setIsUnlocked(false);
    setUser(null);
  };
*/

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setIsAuthenticated(false);
    setIsUnlocked(false);
    setUser(null);
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleEnablePINLock = () => {
    setIsPINEnabled(true);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("kakeibo_dark_mode", newMode.toString());
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen onAuthSuccess={handleAuthSuccess} isDarkMode={isDarkMode} />
    );
  }

  // Show PIN lock screen if authenticated but locked
  if (isAuthenticated && isPINEnabled && !isUnlocked) {
    return <PINLockScreen onUnlock={handleUnlock} isDarkMode={isDarkMode} />;
  }

  // Show settings view if requested
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

  // Show main app
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
