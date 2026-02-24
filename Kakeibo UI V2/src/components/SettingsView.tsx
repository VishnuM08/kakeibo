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
} from "lucide-react";
import { useState } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
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
  onToggleDarkMode,
  displayScale,
  onSetDisplayScale,
}: SettingsViewProps) {
  const [showSetupPIN, setShowSetupPIN] = useState(false);
  const [newPIN, setNewPIN] = useState("");
  const [confirmPIN, setConfirmPIN] = useState("");
  const [pinError, setPinError] = useState("");

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

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"}`}
    >
      <div className="max-w-lg mx-auto px-6 py-6 pt-safe">
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
            <ArrowLeft
              className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
              strokeWidth={2.5}
            />
          </button>
          <h1
            className={`text-[28px] font-bold flex-1 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Settings
          </h1>
        </div>

        {/* User Profile Card */}
        <div
          className={`rounded-[20px] p-5 mb-5 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051d5] flex items-center justify-center">
              <User className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3
                className={`text-[20px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                {userName}
              </h3>
              <p
                className={`text-[15px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                {userEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div
          className={`rounded-[20px] overflow-hidden mb-5 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="px-5 py-4">
            <h3
              className={`text-[17px] font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Security
            </h3>
            <p
              className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              Protect your financial data
            </p>
          </div>

          {/* PIN Lock Toggle */}
          <button
            onClick={() =>
              isPINEnabled ? handleDisablePIN() : setShowSetupPIN(true)
            }
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
              isDarkMode ? "text-white/50" : "text-black/60"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center px-5">
          <div
            className={`rounded-[28px] w-full max-w-md p-6 ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
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
    </div>
  );
}
