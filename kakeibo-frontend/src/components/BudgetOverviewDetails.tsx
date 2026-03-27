import { X, Wallet, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BudgetOverviewDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  monthlyBudget: number;
  currentSpending: number;
  remainingBalance: number;
  daysRemaining: number;
  dailyAllowance: number;
  percentageSpent: number;
  isOverBudget: boolean;
  onSetBudget: () => void;
}

export function BudgetOverviewDetails({
  isOpen,
  onClose,
  isDarkMode,
  monthlyBudget,
  currentSpending,
  remainingBalance,
  daysRemaining,
  dailyAllowance,
  percentageSpent,
  isOverBudget,
  onSetBudget,
}: BudgetOverviewDetailsProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[12000] flex items-end justify-center bg-black/60 backdrop-blur-xl"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-t-[30px] shadow-2xl ${
              isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
            }`}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div
                className={`w-10 h-1 rounded-full ${
                  isDarkMode ? "bg-white/20" : "bg-black/20"
                }`}
              />
            </div>

            <div className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
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
                  onClick={onClose}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDarkMode
                      ? "bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white"
                      : "bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black"
                  }`}
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="mb-5">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-[48px] font-bold tabular-nums ${getStatusColor()}`}
                    >
                      ₹
                      {Math.abs(remainingBalance).toFixed(0)}
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
              </div>

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
                    <strong>₹{Math.abs(remainingBalance).toFixed(0)}</strong>
                    . Review expenses or adjust budget.
                  </p>
                </div>
              )}

              <button
                onClick={onSetBudget}
                className={`w-full py-4 px-4 rounded-[14px] transition-colors font-bold text-[16px] shadow-lg ${
                  isDarkMode
                    ? "bg-white hover:bg-white/90 text-black shadow-white/5"
                    : "bg-black hover:bg-black/90 text-white shadow-black/10"
                }`}
              >
                Edit Budget
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
