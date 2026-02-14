import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Budget Overview Component (Merged Budget Warning + Remaining Balance)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 * ═══════════════════════════════════════════════════════════════════════════
 * A minimalist, catchy budget display that shows:
 * - Remaining balance at a glance
 * - Quick status indicator
 * - Click to expand for detailed stats
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND INTEGRATION:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * API ENDPOINTS:
 * - POST /api/budget - Store/update monthly budget
 * - GET /api/budget/current - Get remaining balance and stats
 *
 * See: BUDGET_REMAINING_BALANCE_DOCUMENTATION.md for complete integration guide
 */

interface BudgetOverviewProps {
  monthlyBudget: number | null;
  currentSpending: number;
  onSetBudget: () => void;
  isDarkMode?: boolean;
}

export function BudgetOverview({
  monthlyBudget,
  currentSpending,
  onSetBudget,
  isDarkMode = false,
}: BudgetOverviewProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════

  const [isExpanded, setIsExpanded] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════

  // Calculate remaining balance locally
  const localRemaining = monthlyBudget ? monthlyBudget - currentSpending : null;

  // Calculate percentage spent
  const percentageSpent = monthlyBudget
    ? (currentSpending / monthlyBudget) * 100
    : 0;

  // Check if over budget
  const isOverBudget = localRemaining !== null && localRemaining < 0;

  // Calculate days remaining in month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, lastDayOfMonth.getDate() - today.getDate());

  // Calculate daily budget allowance
  const dailyAllowance =
    localRemaining && daysRemaining > 0 ? localRemaining / daysRemaining : 0;

  // ═══════════════════════════════════════════════════════════
  // BACKEND API INTEGRATION
  // ═══════════════════════════════════════════════════════════

  const fetchRemainingBalance = async () => {
    if (!monthlyBudget) return;

    setIsLoading(true);

    try {
      // TODO: BACKEND - Call GET /api/budget/current
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRemainingBalance(localRemaining);
    } catch (error) {
      console.error("Failed to fetch budget:", error);
      setRemainingBalance(localRemaining);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemainingBalance();
  }, [monthlyBudget, currentSpending]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  const getStatusColor = () => {
    if (isOverBudget) return isDarkMode ? "text-[#ff453a]" : "text-[#ff3b30]";
    if (percentageSpent >= 80)
      return isDarkMode ? "text-[#ffd60a]" : "text-[#ffcc00]";
    return isDarkMode ? "text-[#30d158]" : "text-[#34c759]";
  };

  const getStatusBg = () => {
    if (isOverBudget) return isDarkMode ? "bg-[#ff453a]/10" : "bg-[#ff3b30]/10";
    if (percentageSpent >= 80)
      return isDarkMode ? "bg-[#ffd60a]/10" : "bg-[#ffcc00]/10";
    return isDarkMode ? "bg-[#30d158]/10" : "bg-[#34c759]/10";
  };

  const getStatusIcon = () => {
    if (isOverBudget)
      return <AlertCircle className="w-4 h-4" strokeWidth={2.5} />;
    if (percentageSpent >= 80)
      return <TrendingDown className="w-4 h-4" strokeWidth={2.5} />;
    return <TrendingUp className="w-4 h-4" strokeWidth={2.5} />;
  };

  const getStatusText = () => {
    if (isOverBudget) return "Over Budget";
    if (percentageSpent >= 80) return "Almost There";
    return "On Track";
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // If no budget set, show compact CTA
  if (!monthlyBudget) {
    return (
      <button
        onClick={onSetBudget}
        className={`w-full rounded-[20px] p-4 shadow-sm mb-5 transition-all active:scale-[0.98] border ${
          isDarkMode
            ? "bg-[#1c1c1e]/90 border-white/10 hover:bg-[#2c2c2e]/90"
            : "bg-white/80 border-black/5 hover:bg-white/90"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#0a84ff]/20" : "bg-[#007aff]/10"
              }`}
            >
              <Wallet
                className={`w-4 h-4 ${isDarkMode ? "text-[#0a84ff]" : "text-[#007aff]"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="text-left">
              <p
                className={`text-[15px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Set Monthly Budget
              </p>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Track spending & stay on target
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}
            strokeWidth={2.5}
          />
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Compact Card */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full rounded-[20px] p-4 shadow-sm mb-5 transition-all active:scale-[0.98] border ${
          isDarkMode
            ? "bg-[#1c1c1e]/90 border-white/10"
            : "bg-white/80 border-black/5"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusBg()}`}
            >
              <Wallet
                className={`w-5 h-5 ${getStatusColor()}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p
                  className={`text-[20px] font-bold tabular-nums ${getStatusColor()}`}
                >
                  ₹
                  {Math.abs(remainingBalance || localRemaining || 0).toFixed(0)}
                </p>
                {isOverBudget && (
                  <span
                    className={`text-[11px] font-semibold ${getStatusColor()}`}
                  >
                    over
                  </span>
                )}
              </div>
              <p
                className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                {isOverBudget ? "Budget exceeded" : "Remaining this month"}
              </p>
            </div>
          </div>

          {/* Right: Status Badge + Arrow */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${getStatusBg()}`}
            >
              {getStatusIcon()}
              <span className={`text-[11px] font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className={`mt-3 h-1.5 rounded-full overflow-hidden ${
            isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
          }`}
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOverBudget
                ? isDarkMode
                  ? "bg-[#ff453a]"
                  : "bg-[#ff3b30]"
                : percentageSpent >= 80
                  ? isDarkMode
                    ? "bg-[#ffd60a]"
                    : "bg-[#ffcc00]"
                  : isDarkMode
                    ? "bg-[#30d158]"
                    : "bg-[#34c759]"
            }`}
            style={{ width: `${Math.min(100, percentageSpent)}%` }}
          />
        </div>
      </button>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-t-[30px] shadow-2xl animate-slide-up ${
              isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
            }`}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className={`w-10 h-1 rounded-full ${
                  isDarkMode ? "bg-white/20" : "bg-black/20"
                }`}
              />
            </div>

            {/* Content */}
            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Wallet
                    className={`w-5 h-5 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                    strokeWidth={2.5}
                  />
                  <h3
                    className={`text-[20px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
                  >
                    Budget Overview
                  </h3>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDarkMode
                      ? "bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white"
                      : "bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black"
                  }`}
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* Main Balance */}
              <div className="mb-5">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`text-[48px] font-bold tabular-nums ${getStatusColor()}`}
                      >
                        ₹
                        {Math.abs(
                          remainingBalance || localRemaining || 0,
                        ).toFixed(2)}
                      </span>
                      {isOverBudget && (
                        <span
                          className={`text-[17px] font-semibold ${getStatusColor()}`}
                        >
                          over budget
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[15px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                    >
                      {isOverBudget
                        ? "You've exceeded your budget"
                        : "Available to spend this month"}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div
                className={`grid grid-cols-2 gap-3 p-4 rounded-[16px] mb-4 ${
                  isDarkMode ? "bg-[#2c2c2e]/50" : "bg-[#f5f5f7]/50"
                }`}
              >
                <div>
                  <p
                    className={`text-[13px] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                  >
                    Budget
                  </p>
                  <p
                    className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}
                  >
                    ₹{monthlyBudget.toFixed(0)}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[13px] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                  >
                    Spent
                  </p>
                  <p
                    className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}
                  >
                    ₹{currentSpending.toFixed(0)}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[13px] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                  >
                    Days Left
                  </p>
                  <p
                    className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}
                  >
                    {daysRemaining}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[13px] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                  >
                    Per Day
                  </p>
                  <p
                    className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}
                  >
                    ₹{Math.max(0, dailyAllowance).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p
                    className={`text-[13px] font-semibold ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                  >
                    {Math.round(percentageSpent)}% used
                  </p>
                  <div
                    className={`flex items-center gap-1.5 ${getStatusColor()}`}
                  >
                    {getStatusIcon()}
                    <span className="text-[13px] font-semibold">
                      {getStatusText()}
                    </span>
                  </div>
                </div>

                <div
                  className={`h-2.5 rounded-full overflow-hidden ${
                    isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverBudget
                        ? isDarkMode
                          ? "bg-[#ff453a]"
                          : "bg-[#ff3b30]"
                        : percentageSpent >= 80
                          ? isDarkMode
                            ? "bg-[#ffd60a]"
                            : "bg-[#ffcc00]"
                          : isDarkMode
                            ? "bg-[#30d158]"
                            : "bg-[#34c759]"
                    }`}
                    style={{ width: `${Math.min(100, percentageSpent)}%` }}
                  />
                </div>
              </div>

              {/* Smart Tip */}
              {!isOverBudget && daysRemaining > 0 && (
                <div
                  className={`p-3 rounded-[14px] border mb-4 ${
                    isDarkMode
                      ? "bg-[#0a84ff]/10 border-[#0a84ff]/20"
                      : "bg-[#007aff]/5 border-[#007aff]/10"
                  }`}
                >
                  <p
                    className={`text-[13px] leading-relaxed ${
                      isDarkMode ? "text-[#0a84ff]" : "text-[#007aff]"
                    }`}
                  >
                    💡 Spend <strong>₹{dailyAllowance.toFixed(0)}/day</strong>{" "}
                    for the next <strong>{daysRemaining} days</strong> to stay
                    on budget
                  </p>
                </div>
              )}

              {/* Over Budget Warning */}
              {isOverBudget && (
                <div
                  className={`p-3 rounded-[14px] border mb-4 ${
                    isDarkMode
                      ? "bg-[#ff453a]/10 border-[#ff453a]/20"
                      : "bg-[#ff3b30]/5 border-[#ff3b30]/10"
                  }`}
                >
                  <p
                    className={`text-[13px] leading-relaxed ${
                      isDarkMode ? "text-[#ff453a]" : "text-[#ff3b30]"
                    }`}
                  >
                    ⚠️ Budget exceeded by{" "}
                    <strong>₹{Math.abs(localRemaining || 0).toFixed(0)}</strong>
                    . Review expenses or adjust budget.
                  </p>
                </div>
              )}

              {/* Edit Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onSetBudget();
                }}
                className={`w-full py-3.5 px-4 rounded-[14px] transition-colors font-semibold text-[15px] ${
                  isDarkMode
                    ? "bg-white hover:bg-white/90 text-black"
                    : "bg-black hover:bg-black/90 text-white"
                }`}
              >
                Edit Budget
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
