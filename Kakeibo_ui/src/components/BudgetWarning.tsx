import { AlertTriangle, TrendingUp } from "lucide-react";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

interface BudgetWarningProps {
  monthlyBudget: number;
  currentSpending: number;
  onSetBudget: () => void;
  isDarkMode?: boolean;
}

export function BudgetWarning({
  monthlyBudget,
  currentSpending,
  onSetBudget,
  isDarkMode,
}: BudgetWarningProps) {
  const percentage = (currentSpending / monthlyBudget) * 100;
  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;

  // Calculate daily average and remaining days
  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const currentDay = today.getDate();
  const daysRemaining = daysInMonth - currentDay + 1;
  const dailyAverage = currentSpending / currentDay;
  const projectedSpending = dailyAverage * daysInMonth;
  const isProjectedOverBudget = projectedSpending > monthlyBudget;

  // If no budget is set
  if (!monthlyBudget) {
    return (
      <div className="bg-gradient-to-br from-[#f7b731] to-[#fa8231] rounded-[20px] p-5 mb-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-white mb-1">
              Set Your Monthly Budget
            </h3>
            <p className="text-[15px] text-white/90 mb-3 leading-snug">
              Track your spending better by setting a monthly budget goal.
            </p>
            <button
              onClick={onSetBudget}
              className="bg-white/90 hover:bg-white text-[#fa8231] px-4 py-2 rounded-[10px] font-semibold text-[15px] transition-colors"
            >
              Set Budget
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If over budget
  if (isOverBudget) {
    return (
      <div className="bg-gradient-to-br from-[#ff3b30] to-[#ff453a] rounded-[20px] p-5 mb-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-white mb-1">
              Budget Exceeded
            </h3>
            <p className="text-[15px] text-white/90 mb-2 leading-snug">
              You've spent{" "}
              <span className="font-bold">₹{currentSpending.toFixed(2)}</span>{" "}
              of your ₹{monthlyBudget.toFixed(2)} monthly budget (
              {percentage.toFixed(0)}%).
            </p>
            <p className="text-[13px] text-white/80">
              Consider reviewing your spending habits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If warning (80-99%)
  if (isWarning) {
    return (
      <div className="bg-gradient-to-br from-[#ff9500] to-[#ff9f0a] rounded-[20px] p-5 mb-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-white mb-1">
              Approaching Budget Limit
            </h3>
            <p className="text-[15px] text-white/90 mb-2 leading-snug">
              You've used {percentage.toFixed(0)}% of your monthly budget. Only
              ₹{(monthlyBudget - currentSpending).toFixed(2)} remaining.
            </p>
            <p className="text-[13px] text-white/80">
              {daysRemaining} days left in this month.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If projected to exceed based on daily average
  if (isProjectedOverBudget) {
    return (
      <div className="bg-gradient-to-br from-[#ff9500] to-[#ff9f0a] rounded-[20px] p-5 mb-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-white mb-1">
              On Track to Exceed Budget
            </h3>
            <p className="text-[15px] text-white/90 mb-2 leading-snug">
              Your daily average is{" "}
              <span className="font-bold">{formatINR(dailyAverage)}</span>. At
              this rate, you'll spend {formatINR(projectedSpending)} this month.
            </p>
            <p className="text-[13px] text-white/80">
              Suggested daily limit:{" "}
              {formatINR((monthlyBudget - currentSpending) / daysRemaining)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If on track (show progress)
  return (
    <div
      className={`backdrop-blur-xl rounded-[20px] p-5 mb-5 shadow-sm border ${
        isDarkMode
          ? "bg-[#1c1c1e]/90 border-white/10"
          : "bg-white/80 border-black/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3
            className={`text-[17px] font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Budget Status
          </h3>
          <p
            className={`text-[13px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
          >
            ₹{currentSpending.toFixed(2)} of ₹{monthlyBudget.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-bold text-[#34c759]">
            {percentage.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/5"}`}
      >
        <div
          className="h-full bg-gradient-to-r from-[#34c759] to-[#30d158] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p
        className={`text-[13px] mt-3 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
      >
        Daily average: ₹{dailyAverage.toFixed(2)} • {daysRemaining} days
        remaining
      </p>
    </div>
  );
}
