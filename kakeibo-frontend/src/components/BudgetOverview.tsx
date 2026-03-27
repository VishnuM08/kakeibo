import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BudgetOverviewProps {
  monthlyBudget: number | null;
  currentSpending: number;
  onSetBudget: () => void;
  onExpand?: (data: {
    monthlyBudget: number;
    currentSpending: number;
    remainingBalance: number;
    daysRemaining: number;
    dailyAllowance: number;
    percentageSpent: number;
    isOverBudget: boolean;
  }) => void;
  isDarkMode?: boolean;
}

export function BudgetOverview({
  monthlyBudget,
  currentSpending,
  onSetBudget,
  onExpand,
  isDarkMode = false,
}: BudgetOverviewProps) {
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchRemainingBalance = async () => {
    if (!monthlyBudget) return;
    setIsLoading(true);
    try {
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

  // If no budget set, show compact CTA
  if (!monthlyBudget) {
    return (
      <button
        onClick={onSetBudget}
        className="w-full relative overflow-hidden rounded-[20px] p-5 mb-5 active:scale-[0.98] transition-all duration-300 group text-white text-left"
        style={{
          background: "linear-gradient(135deg, #30d158 0%, #28a745 100%)",
          boxShadow: isDarkMode
            ? "0 8px 24px rgba(48, 209, 88, 0.3)"
            : "0 8px 24px rgba(40, 167, 69, 0.3)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] rounded-bl-full transition-transform duration-500 group-hover:scale-110" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
              <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[17px] font-bold tracking-tight text-white">
                Set Monthly Budget
              </p>
              <p className="text-[14px] mt-0.5 font-medium text-white/80">
                Track spending & stay on target
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 bg-white/20">
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onExpand?.({
        monthlyBudget,
        currentSpending,
        remainingBalance: remainingBalance || localRemaining || 0,
        daysRemaining,
        dailyAllowance,
        percentageSpent,
        isOverBudget
      })}
      className={`w-full rounded-[20px] p-4 shadow-sm mb-5 transition-all active:scale-[0.98] border ${
        isDarkMode
          ? "bg-[#1c1c1e] border-white/10"
          : "bg-white border-black/12 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
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

      <div
        className={`mt-3 h-1.5 rounded-full overflow-hidden ${
          isDarkMode ? "bg-[#2c2c2e]" : "bg-gray-100 border border-black/5"
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
  );
}
