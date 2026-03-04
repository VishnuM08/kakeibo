import {
  Home,
  Calendar,
  Target,
  Repeat,
  Search,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void; // Renamed from onToggleTheme
  onOpenSettings: () => void;
  onOpenHelp?: () => void;
  onOpenAnalytics?: () => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  isDarkMode,
  onToggleDarkMode, // Renamed from onToggleTheme
  onOpenSettings,
  onOpenHelp,
  onOpenAnalytics,
}: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "goals", label: "Savings Goals", icon: Target },
    { id: "recurring", label: "Recurring", icon: Repeat },
  ];

  return (
    <div
      className={`hidden lg:flex w-[260px] h-screen sticky top-0 flex-col py-8 px-5 border-r transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#1c1c1e] text-white border-white/10"
          : "bg-[#f5f5f7] text-black border-black/5"
      }`}
    >
      {/* Brand */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#007aff] to-[#0051D5] flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-[20px] leading-none">
            K
          </span>
        </div>
        <h1 className="text-[24px] font-bold tracking-tight">Kakeibo</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5">
        <div className="px-2 mb-3 mt-4">
          <p
            className={`text-[12px] font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-white/40" : "text-black/40"
            }`}
          >
            Menu
          </p>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-[12px] text-[15px] font-medium transition-all duration-200 group ${
                isActive
                  ? isDarkMode
                    ? "bg-[#0a84ff]/10 text-[#0a84ff]"
                    : "bg-[#007aff]/10 text-[#007aff]"
                  : isDarkMode
                    ? "text-white/70 hover:bg-white/5 hover:text-white"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? isDarkMode
                      ? "text-[#0a84ff]"
                      : "text-[#007aff]"
                    : isDarkMode
                      ? "text-white/50 group-hover:text-white"
                      : "text-black/50 group-hover:text-black"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}

              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={`absolute left-0 w-1 h-8 rounded-r-full ${
                    isDarkMode ? "bg-[#0a84ff]" : "bg-[#007aff]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div
        className={`mt-auto pt-6 border-t ${
          isDarkMode ? "border-white/10" : "border-black/5"
        }`}
      >
        <div className="space-y-1.5">
          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${
              isDarkMode
                ? "text-white/70 hover:bg-white/5 hover:text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Settings
              className={`w-5 h-5 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              strokeWidth={2}
            />
            Settings
          </button>

          <button
            onClick={onOpenHelp}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${
              isDarkMode
                ? "text-white/70 hover:bg-white/5 hover:text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <HelpCircle
              className={`w-5 h-5 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              strokeWidth={2}
            />
            Help & Documentation
          </button>

          <button
            onClick={() => onOpenAnalytics && onOpenAnalytics()}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${
              isDarkMode
                ? "text-white/70 hover:bg-white/5 hover:text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <BarChart3
              className={`w-5 h-5 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              strokeWidth={2}
            />
            Analytics
          </button>

          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${
              isDarkMode
                ? "text-white/70 hover:bg-white/5 hover:text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <div className="flex items-center gap-3.5">
              {isDarkMode ? (
                <Moon className={`w-5 h-5 text-white/50`} strokeWidth={2} />
              ) : (
                <Sun className={`w-5 h-5 text-black/50`} strokeWidth={2} />
              )}
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </div>

            {/* Apple-style Switch indicator */}
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDarkMode
                  ? "bg-[#34c759] justify-end"
                  : "bg-[#e5e5ea] justify-start"
              }`}
            >
              <motion.div
                layout
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
