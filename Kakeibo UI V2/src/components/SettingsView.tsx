import {
  ArrowLeft,
  Lock,
  User,
  Bell,
  Palette,
  Database,
  LogOut,
  Shield,
  Trash2,
  ChevronRight,
  X,
  PlayCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { motion, AnimatePresence } from "motion/react";
//import { logout } from '../services/api';

/**
 * Settings View Component
 *
 * BACKEND INTEGRATION:
 * - User profile updates via PUT /api/user/profile
 * - PIN lock settings via POST /api/user/pin
 * - Logout via POST /api/auth/logout
 * - Data sync settings
 */

interface SettingsViewProps {
  onClose: () => void;
  onLogout: () => void;
  onEnablePINLock: () => void;
  isPINEnabled: boolean;
  userName: string;
  userEmail: string;
  isDarkMode: boolean;
  themeMode: "light" | "dark" | "oled";
  onToggleDarkMode: () => void;
  displayScale: number;
  onSetDisplayScale: (scale: number) => void;
}

export function SettingsView({
  onClose,
  onLogout,
  onEnablePINLock,
  isPINEnabled,
  userName,
  userEmail,
  isDarkMode,
  themeMode,
  onToggleDarkMode,
  displayScale,
  onSetDisplayScale,
}: SettingsViewProps) {
  const [showSetupPIN, setShowSetupPIN] = useState(false);
  const [newPIN, setNewPIN] = useState("");
  const [confirmPIN, setConfirmPIN] = useState("");
  const [pinError, setPinError] = useState("");
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSetupPIN = async () => {
    if (newPIN.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }

    if (newPIN !== confirmPIN) {
      setPinError("PINs do not match");
      return;
    }

    // For now, save to Preferences (hashed in production)
    await Preferences.set({ key: "kakeibo_user_pin", value: btoa(newPIN) });
    await Preferences.set({ key: "kakeibo_pin_enabled", value: "true" });

    setShowSetupPIN(false);
    setNewPIN("");
    setConfirmPIN("");
    setPinError("");
    onEnablePINLock();
  };

  const handleDisablePIN = async () => {
    if (window.confirm("Are you sure you want to disable PIN lock?")) {
      await Preferences.remove({ key: "kakeibo_user_pin" });
      await Preferences.set({ key: "kakeibo_pin_enabled", value: "false" });
      // In a real app, we'd notify the parent here to update state
      window.location.reload(); // Quick fix to refresh state in App.tsx
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await Preferences.clear();
      onLogout();
    }
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "This will delete all your local data. This cannot be undone. Are you sure?",
      )
    ) {
      // TODO: BACKEND INTEGRATION - In production, this should only clear local cache
      // Backend data remains intact
      localStorage.removeItem("kakeibo_expenses");
      localStorage.removeItem("kakeibo_monthly_budget");
      localStorage.removeItem("kakeibo_savings_goals");
      localStorage.removeItem("kakeibo_recurring_expenses");
      alert("Local data cleared. Please refresh the app.");
    }
  };

  const handleRestartTour = () => {
    localStorage.removeItem("kakeiboTourCompleted");
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new Event("startWalkthroughTour"));
    }, 300);
  };

  const sectionContent = (
    <div
      style={{
        display: isDesktop ? "grid" : "flex",
        gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
        flexDirection: isDesktop ? "unset" : "column",
        gap: 20,
      }}
    >
      {/* User Profile Card */}
      <div
        style={{
          borderRadius: 16,
          padding: "20px",
          background: isDarkMode ? "#2c2c2e" : "#f5f5f7",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#007aff,#0051D5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User
            style={{ width: 28, height: 28, color: "#fff" }}
            strokeWidth={2.5}
          />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: isDarkMode ? "#fff" : "#000",
            }}
          >
            {userName}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 14,
              color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            {userEmail}
          </p>
        </div>
      </div>

      <div style={{ gridColumn: isDesktop ? "1 / -1" : "auto" }}>
        {/* Settings Sections */}
        <div
          style={{
            display: isDesktop ? "grid" : "flex",
            gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
            flexDirection: isDesktop ? "unset" : "column",
            gap: 20,
          }}
        >
          {[
            {
              title: "Security",
              subtitle: "Protect your financial data",
              items: [
                {
                  icon: Lock,
                  label: "PIN Lock",
                  sub: isPINEnabled ? "Enabled" : "Disabled",
                  badge: isPINEnabled
                    ? { text: "ON", color: "#34c759" }
                    : { text: "OFF", color: "#ff3b30" },
                  action: () =>
                    isPINEnabled ? handleDisablePIN() : setShowSetupPIN(true),
                },
                {
                  icon: Shield,
                  label: "Face ID / Touch ID",
                  sub: "Coming soon",
                  badge: null,
                  action: undefined,
                },
              ],
            },
            {
              title: "Appearance",
              subtitle: "Theme & Mode",
              items: [
                {
                  icon: Palette,
                  label: "Theme",
                  sub:
                    themeMode === "oled"
                      ? "OLED"
                      : themeMode === "dark"
                        ? "Dark"
                        : "Light",
                  badge: null,
                  action: async () => {
                    await Haptics.impact({ style: ImpactStyle.Light });
                    onToggleDarkMode();
                  },
                },
                {
                  icon: PlayCircle,
                  label: "Restart App Tour",
                  sub: "Replays the welcome walkthrough",
                  badge: null,
                  action: async () => {
                    await Haptics.impact({ style: ImpactStyle.Light });
                    handleRestartTour();
                  },
                },
              ],
            },
            {
              title: "Data & Storage",
              subtitle: "Offline mode & sync settings",
              items: [
                {
                  icon: Database,
                  label: "Offline Mode",
                  sub: "Data synced with server when online",
                  badge: { text: "Active", color: "#34c759" },
                  action: undefined,
                },
                {
                  icon: Trash2,
                  label: "Clear Local Data",
                  sub: "Remove all cached data",
                  labelColor: "#ff3b30",
                  badge: null,
                  action: handleClearData,
                },
              ],
            },
          ].map((section) => (
            <div
              key={section.title}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                background: isDarkMode ? "#2c2c2e" : "#ffffff",
                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
              }}
            >
              <div style={{ padding: "14px 18px 10px" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  {section.title}
                </p>
                {section.subtitle && (
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: isDarkMode
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    }}
                  >
                    {section.subtitle}
                  </p>
                )}
              </div>
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={!item.action}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "none",
                    border: "none",
                    borderTop: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                    cursor: item.action ? "pointer" : "default",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: isDarkMode
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <item.icon
                      style={{
                        width: 18,
                        height: 18,
                        color:
                          (item as { labelColor?: string }).labelColor ||
                          (isDarkMode ? "#fff" : "#000"),
                      }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        color:
                          (item as { labelColor?: string }).labelColor ||
                          (isDarkMode ? "#fff" : "#000"),
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        margin: "1px 0 0",
                        fontSize: 12,
                        color: isDarkMode
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.4)",
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                  {(item as { toggle?: boolean }).toggle !== undefined ? (
                    <div
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 13,
                        background: (item as { toggle?: boolean }).toggle
                          ? "#34c759"
                          : isDarkMode
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.15)",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: (item as { toggle?: boolean }).toggle ? 21 : 3,
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                  ) : item.badge ? (
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 20,
                        background: item.badge.color + "25",
                        color: item.badge.color,
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {item.badge.text}
                    </span>
                  ) : (
                    <ChevronRight
                      style={{
                        width: 16,
                        height: 16,
                        color: isDarkMode
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(0,0,0,0.3)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ gridColumn: isDesktop ? "1 / -1" : "auto" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: isDarkMode
              ? "rgba(255,59,48,0.15)"
              : "rgba(255,59,48,0.08)",
            color: "#ff3b30",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut style={{ width: 18, height: 18 }} strokeWidth={2.5} />
          Logout
        </button>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingBottom: 8,
            gridColumn: isDesktop ? "1 / -1" : "auto",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
            }}
          >
            © 2026 Aignite Technologies. All rights reserved.
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 11,
              color: isDarkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
            }}
          >
            Designed and engineered by Lavish.
          </p>
        </div>
      </div>
    </div>
  );

  // PIN modal (shared)
  const pinModal = showSetupPIN && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Absolute Backdrop Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={() => {
          setShowSetupPIN(false);
          setNewPIN("");
          setConfirmPIN("");
          setPinError("");
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: 24,
          width: "100%",
          maxWidth: 420,
          padding: 24,
          background: isDarkMode ? "#1c1c1e" : "#fff",
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 20px",
            color: isDarkMode ? "#fff" : "#000",
          }}
        >
          Setup PIN Lock
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 6,
                color: isDarkMode ? "#fff" : "#000",
              }}
            >
              Enter 4-digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPIN}
              onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                background: isDarkMode ? "#2c2c2e" : "#f5f5f7",
                color: isDarkMode ? "#fff" : "#000",
                fontSize: 22,
                textAlign: "center",
                letterSpacing: "0.5em",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 6,
                color: isDarkMode ? "#fff" : "#000",
              }}
            >
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPIN}
              onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                background: isDarkMode ? "#2c2c2e" : "#f5f5f7",
                color: isDarkMode ? "#fff" : "#000",
                fontSize: 22,
                textAlign: "center",
                letterSpacing: "0.5em",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {pinError && (
            <p style={{ color: "#ff3b30", fontSize: 14, margin: 0 }}>
              {pinError}
            </p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setShowSetupPIN(false);
                setNewPIN("");
                setConfirmPIN("");
                setPinError("");
              }}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                border: "none",
                background: isDarkMode ? "#2c2c2e" : "#f5f5f7",
                color: isDarkMode ? "#fff" : "#000",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSetupPIN}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                border: "none",
                background: isDarkMode ? "#fff" : "#000",
                color: isDarkMode ? "#000" : "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Desktop Layout: centered dialog ──
  if (isDesktop) {
    return (
      <>
        <div
          className="animate-fade-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            className="animate-modal-enter glass-panel"
            style={{
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 32,
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 28px 20px",
                borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                Settings
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "none",
                  background: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDarkMode
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(0,0,0,0.6)",
                }}
              >
                <X style={{ width: 16, height: 16 }} strokeWidth={2.5} />
              </button>
            </div>
            {/* Dialog Body */}
            <div style={{ padding: "24px 28px" }}>{sectionContent}</div>
          </div>
        </div>
        {pinModal}
      </>
    );
  }

  // ── Mobile Layout: full screen ──
  const mobileBg =
    themeMode === "oled" ? "#000000" : isDarkMode ? "#0a0a0c" : "#f5f5f7";
  const cardBg =
    themeMode === "oled" ? "#000000" : isDarkMode ? "#1c1c1e" : "#ffffff";
  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const borderStyle = `1px solid ${themeMode === "oled" ? "rgba(255,255,255,0.15)" : isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`;

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto animate-modal-enter transition-colors duration-300 custom-scrollbar shadow-2xl"
      style={{ background: mobileBg }}
    >
      <div
        className="max-w-lg mx-auto px-6 pb-24 safe-top"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
      >
        {/* Drag Handle (Mobile only) */}
        <div className="w-12 h-1.5 bg-gray-300/30 dark:bg-gray-600/30 rounded-full mx-auto mb-6 mt-[-10px] sm:hidden" />
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                : "bg-white hover:bg-[#e5e5e7]"
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${textColor}`} strokeWidth={2.5} />
          </button>
          <h1 className={`text-[28px] font-bold flex-1 ${textColor}`}>
            Settings
          </h1>
        </div>

        {/* User Profile Card */}
        <div
          className={`rounded-[20px] p-5 mb-5 shadow-sm transition-colors`}
          style={{ background: cardBg, border: borderStyle }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051D5] flex items-center justify-center">
              <User className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className={`text-[20px] font-bold ${textColor}`}>
                {userName}
              </h3>
              <p className={`text-[15px] ${subTextColor}`}>{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div
          className={`rounded-[20px] overflow-hidden mb-5 shadow-sm transition-colors`}
          style={{ background: cardBg, border: borderStyle }}
        >
          <div className="px-5 py-4">
            <h3 className={`text-[17px] font-bold mb-1 ${textColor}`}>
              Security
            </h3>
            <p className={`text-[13px] ${subTextColor}`}>
              Protect your financial data
            </p>
          </div>

          {/* PIN Lock Toggle */}
          <button
            onClick={() =>
              isPINEnabled ? handleDisablePIN() : setShowSetupPIN(true)
            }
            className={`w-full px-5 py-4 flex items-center gap-3 transition-colors border-t`}
            style={{ borderTop: borderStyle }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
              }`}
            >
              <Lock
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[17px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                PIN Lock
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                {isPINEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-[13px] font-semibold ${
                isPINEnabled
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {isPINEnabled ? "ON" : "OFF"}
            </div>
          </button>

          {/* Biometric (Placeholder) */}
          <button
            className={`w-full px-5 py-4 flex items-center gap-3 transition-colors border-t ${
              isDarkMode
                ? "hover:bg-white/5 border-white/10"
                : "hover:bg-black/5 border-black/5"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
              }`}
            >
              <Shield
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[17px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Face ID / Touch ID
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Coming soon
              </p>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}
            />
          </button>
        </div>

        {/* Appearance Settings */}
        <div
          className={`rounded-[20px] overflow-hidden mb-5 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="px-5 py-4">
            <h3
              className={`text-[17px] font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Appearance
            </h3>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={async () => {
              await Haptics.impact({ style: ImpactStyle.Light });
              onToggleDarkMode();
            }}
            className={`w-full px-5 py-4 flex items-center gap-3 transition-colors border-t ${
              isDarkMode
                ? "hover:bg-white/5 border-white/10"
                : "hover:bg-black/5 border-black/5"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
              }`}
            >
              <Palette
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[17px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Dark Mode
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                {isDarkMode ? "On" : "Off"}
              </p>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors ${
                isDarkMode ? "bg-[#34c759]" : "bg-black/20"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform mt-1 ${
                  isDarkMode ? "ml-6" : "ml-1"
                }`}
              />
            </div>
          </button>

          {/* Restart Tour Button */}
          <button
            onClick={async () => {
              await Haptics.impact({ style: ImpactStyle.Light });
              handleRestartTour();
            }}
            className={`w-full px-5 py-4 flex items-center gap-3 transition-colors border-t ${
              isDarkMode
                ? "hover:bg-white/5 border-white/10"
                : "hover:bg-black/5 border-black/5"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
              }`}
            >
              <PlayCircle
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[17px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Restart App Tour
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Replays the welcome walkthrough
              </p>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}
            />
          </button>
        </div>

        {/* Display Settings */}
        <div
          className={`rounded-[20px] overflow-hidden mb-5 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="px-5 py-4">
            <h3
              className={`text-[17px] font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Display size
            </h3>
            <p
              className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              Adjust overall application size
            </p>
          </div>

          <div
            className={`px-5 py-6 space-y-6 border-t ${
              isDarkMode ? "border-white/10" : "border-black/5"
            }`}
          >
            {/* Range Slider Container */}
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-1 px-1">
                <span
                  className={`text-[12px] font-medium ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                >
                  A
                </span>
                <span
                  className={`text-[15px] font-bold ${isDarkMode ? "text-white/70" : "text-black/70"}`}
                >
                  Default
                </span>
                <span
                  className={`text-[20px] font-medium ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                >
                  A
                </span>
              </div>

              <div className="relative pt-2 pb-6 flex flex-col items-center">
                {/* Visual Tick Marks */}
                <div className="absolute top-0 left-0 right-0 flex justify-between px-[14px]">
                  {[0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3].map((val) => (
                    <div
                      key={val}
                      className={`w-[1px] h-2 rounded-full ${
                        isDarkMode ? "bg-white/20" : "bg-black/10"
                      } ${val === 1.0 ? (isDarkMode ? "h-3 bg-white/40" : "h-3 bg-black/30") : ""}`}
                    />
                  ))}
                </div>

                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.1"
                  value={displayScale}
                  onChange={async (e) => {
                    const newValue = parseFloat(e.target.value);
                    if (newValue !== displayScale) {
                      await Haptics.impact({ style: ImpactStyle.Light });
                      onSetDisplayScale(newValue);
                    }
                  }}
                  onBlur={async () => {
                    await Preferences.set({
                      key: "kakeibo_display_scale",
                      value: displayScale.toString(),
                    });
                  }}
                  className="custom-slider"
                />
              </div>

              <div className="flex justify-between items-center px-1">
                <p
                  className={`text-[14px] font-semibold ${isDarkMode ? "text-white/60" : "text-black/60"}`}
                >
                  {Math.round(displayScale * 100)}%
                </p>
                {displayScale !== 1.0 && (
                  <button
                    onClick={async () => {
                      onSetDisplayScale(1.0);
                      await Preferences.set({
                        key: "kakeibo_display_scale",
                        value: "1.0",
                      });
                    }}
                    className="text-[13px] font-bold text-[#007aff] px-3 py-1.5 rounded-full bg-[#007aff]/10 active:scale-95 transition-transform"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div
          className={`rounded-[20px] overflow-hidden mb-5 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="px-5 py-4">
            <h3
              className={`text-[17px] font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Data & Storage
            </h3>
            <p
              className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              Offline mode & sync settings
            </p>
          </div>

          {/* Sync Status */}
          <div
            className={`px-5 py-4 flex items-center gap-3 border-t ${
              isDarkMode ? "border-white/10" : "border-black/5"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
              }`}
            >
              <Database
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1">
              <p
                className={`text-[17px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Offline Mode
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Data synced with server when online
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/20">
              <p className="text-[13px] font-semibold text-green-500">Active</p>
            </div>
          </div>

          {/* Clear Local Data */}
          <button
            onClick={handleClearData}
            className={`w-full px-5 py-4 flex items-center gap-3 transition-colors border-t ${
              isDarkMode
                ? "hover:bg-white/5 border-white/10"
                : "hover:bg-black/5 border-black/5"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-red-500/20" : "bg-red-50"
              }`}
            >
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-[17px] font-semibold text-red-500`}>
                Clear Local Data
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Remove all cached data
              </p>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] font-semibold text-[17px] ${
            isDarkMode
              ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
              : "bg-red-50 hover:bg-red-100 text-red-600"
          }`}
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          <span>Logout</span>
        </button>

        {/* App Version */}
        <div className="mt-6 text-center space-y-1">
          <p
            className={`text-[11px] ${
              isDarkMode ? "text-white/50" : "text-black/70"
            }`}
          >
            © 2026 Aignite Technologies. All rights reserved.
          </p>
          <p
            className={`text-[11px] ${
              isDarkMode ? "text-white/40" : "text-black/55"
            }`}
          >
            Designed and engineered by Lavish.
          </p>
        </div>
      </div>

      {/* Setup PIN Modal */}
      {showSetupPIN && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
          {/* Absolute Backdrop Layer */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={() => {
              setShowSetupPIN(false);
              setNewPIN("");
              setConfirmPIN("");
              setPinError("");
            }}
          />
          <div
            className={`relative z-10 rounded-[28px] w-full max-w-md p-6 ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <h3
              className={`text-[24px] font-bold mb-6 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Setup PIN Lock
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
                >
                  Enter 4-digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPIN}
                  onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className={`w-full px-4 py-3.5 rounded-[12px] text-[24px] text-center tracking-[0.5em] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                      : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
                >
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPIN}
                  onChange={(e) =>
                    setConfirmPIN(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="••••"
                  className={`w-full px-4 py-3.5 rounded-[12px] text-[24px] text-center tracking-[0.5em] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                      : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                  }`}
                />
              </div>

              {pinError && (
                <p className="text-red-500 text-[15px] font-medium">
                  {pinError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSetupPIN(false);
                    setNewPIN("");
                    setConfirmPIN("");
                    setPinError("");
                  }}
                  className={`flex-1 py-3 rounded-[12px] font-semibold text-[17px] ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white"
                      : "bg-[#f5f5f7] text-black"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetupPIN}
                  className={`flex-1 py-3 rounded-[12px] font-semibold text-[17px] ${
                    isDarkMode ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
