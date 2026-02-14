import {
  X,
  Coffee,
  ShoppingBag,
  Train,
  Utensils,
  Sparkles,
  Gift,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { formatTime } from "../utils/dateUtils";
import { UIExpense } from "../types/UIExpense";

// interface Expense {
//   id: string;
//   description: string;
//   category: string;
//   amount: number;
//   date: string;
// }

interface DailyExpensePopupProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  expenses: UIExpense[];
  isDarkMode?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: typeof Coffee } = {
    food: Utensils,
    transport: Train,
    coffee: Coffee,
    shopping: ShoppingBag,
    entertainment: Sparkles,
    utilities: Zap,
    other: MoreHorizontal,
  };
  return icons[category.toLowerCase()] || MoreHorizontal;
};

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    food: "from-[#ff6b6b] to-[#ee5a6f]",
    transport: "from-[#4ecdc4] to-[#44a08d]",
    coffee: "from-[#f7b731] to-[#fa8231]",
    shopping: "from-[#a29bfe] to-[#6c5ce7]",
    entertainment: "from-[#fd79a8] to-[#e84393]",
    utilities: "from-[#00b894] to-[#00cec9]",
    other: "from-[#b2bec3] to-[#636e72]",
  };
  return colors[category.toLowerCase()] || "from-[#b2bec3] to-[#636e72]";
};

export function DailyExpensePopup({
  isOpen,
  onClose,
  date,
  expenses,
  isDarkMode,
}: DailyExpensePopupProps) {
  if (!isOpen || !date) return null;

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-black/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-[24px] font-bold text-black mb-1">
                Daily Expenses
              </h2>
              <p className="text-[15px] text-black/50">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-black" strokeWidth={2.5} />
            </button>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[16px] p-4 mt-4">
            <p className="text-white/70 text-[13px] font-semibold mb-1">
              Total Spent
            </p>
            <p className="text-white text-[36px] font-bold tracking-tight">
              ₹{total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense, index) => {
                const Icon = getCategoryIcon(expense.category);
                const color = getCategoryColor(expense.category);
                let time = expense.time;
                return (
                  <div
                    key={expense.id}
                    className="bg-[#f5f5f7] rounded-[16px] p-4 flex items-center gap-3.5"
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-semibold text-black mb-0.5">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] text-black/40 capitalize">
                          {expense.category}
                        </p>
                        <span className="text-black/20">•</span>
                        <p className="text-[13px] text-black/40">{time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-black tabular-nums">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
                <MoreHorizontal className="w-8 h-8 text-black/20" />
              </div>
              <p className="text-[17px] text-black/40">
                No expenses on this day
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
