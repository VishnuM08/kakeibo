import React, { useEffect, useState, forwardRef } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Pause, 
  Play, 
  AlertCircle,
  TrendingUp,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getRecurringExpenses, 
  deleteRecurringExpense, 
  updateRecurringExpense,
  RecurringExpense 
} from "../services/api";
import { toast } from "../utils/toast";
import { 
  calculateNextOccurrence, 
  isDue as checkIsDue, 
  getDaysUntil as checkDaysUntil 
} from "../utils/recurringUtils";

interface RecurringExpenseWithNext extends RecurringExpense {
  nextOccurrence: string;
}

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: any } = {
    food: Calendar,
    transport: Calendar,
    utilities: Calendar,
    entertainment: Calendar,
    shopping: Calendar,
    coffee: Calendar,
    other: Calendar,
  };
  return icons[category.toLowerCase()] || Calendar;
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

interface RecurringExpensesViewProps {
  onClose: () => void;
  isDarkMode: boolean;
  onAddExpense?: (expense: any) => void;
}

export function RecurringExpensesView({
  onClose,
  isDarkMode,
  onAddExpense,
}: RecurringExpensesViewProps) {
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const fetchedExpenses = await getRecurringExpenses();
      
      // Calculate next occurrences and save to localStorage for the widget
      const withNextOccurrences: RecurringExpenseWithNext[] = fetchedExpenses.map(exp => ({
        ...exp,
        nextOccurrence: calculateNextOccurrence(exp.startDate, exp.frequency, exp.lastGenerated)
      }));
      
      setRecurringExpenses(fetchedExpenses);
      localStorage.setItem("kakeibo_recurring_expenses", JSON.stringify(withNextOccurrences));
    } catch (err) {
      console.error("Failed to load recurring expenses", err);
      toast.error("Could not fetch recurring expenses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

    const handleRefresh = () => fetchExpenses();
    window.addEventListener('recurringExpenseChanged', handleRefresh);
    return () => window.removeEventListener('recurringExpenseChanged', handleRefresh);
  }, []);

  const handleToggleActive = async (id: string) => {
    try {
      const expense = recurringExpenses.find((e) => e.id === id);
      if (!expense) return;

      const updated = { ...expense, isActive: !expense.isActive };
      await updateRecurringExpense(id, updated);
      
      const updatedExpenses = recurringExpenses.map((e) => (e.id === id ? updated : e));
      setRecurringExpenses(updatedExpenses);

      // Update localStorage for widget
      const withNext = updatedExpenses.map(exp => ({
        ...exp,
        nextOccurrence: calculateNextOccurrence(exp.startDate, exp.frequency, exp.lastGenerated)
      }));
      localStorage.setItem("kakeibo_recurring_expenses", JSON.stringify(withNext));

      toast.success(`Expense ${updated.isActive ? "resumed" : "paused"}`);
    } catch (err) {
      console.error("Toggle failed", err);
      toast.error("Failed to update expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recurring expense?"))
      return;

    try {
      await deleteRecurringExpense(id);
      const updated = recurringExpenses.filter((e) => e.id !== id);
      setRecurringExpenses(updated);
      
      // Update localStorage for widget
      const withNext = updated.map(exp => ({
        ...exp,
        nextOccurrence: calculateNextOccurrence(exp.startDate, exp.frequency, exp.lastGenerated)
      }));
      localStorage.setItem("kakeibo_recurring_expenses", JSON.stringify(withNext));

      toast.success("Recurring expense deleted");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete expense");
    }
  };

  const handleProcessNow = async (expense: RecurringExpense) => {
    if (onAddExpense) {
      onAddExpense({
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        expenseDateTime: new Date().toISOString(),
      });

      try {
        const updatedExpense = {
          ...expense,
          lastGenerated: new Date().toISOString(),
        };
        await updateRecurringExpense(expense.id, updatedExpense);

        const updatedExpenses = recurringExpenses.map((exp) => 
          exp.id === expense.id ? updatedExpense : exp
        );
        setRecurringExpenses(updatedExpenses);

        const withNext = updatedExpenses.map(exp => ({
          ...exp,
          nextOccurrence: calculateNextOccurrence(exp.startDate, exp.frequency, exp.lastGenerated)
        }));
        localStorage.setItem("kakeibo_recurring_expenses", JSON.stringify(withNext));
        
        toast.success("Expense added successfully!");
      } catch (err) {
        console.error("Failed to update processed date", err);
      }
    }
  };

  const activeExpenses = recurringExpenses.filter((exp) => exp.isActive);
  const pausedExpenses = recurringExpenses.filter((exp) => !exp.isActive);

  const monthlyProjection = activeExpenses.reduce((sum, exp) => {
    let monthlyAmount = 0;
    switch (exp.frequency) {
      case "daily": monthlyAmount = exp.amount * 30; break;
      case "weekly": monthlyAmount = exp.amount * 4; break;
      case "monthly": monthlyAmount = exp.amount; break;
      case "yearly": monthlyAmount = exp.amount / 12; break;
    }
    return sum + monthlyAmount;
  }, 0);

  return (
    <div 
      className={`w-full h-full flex flex-col max-w-lg mx-auto min-h-0 ${
        isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className={`sticky top-0 z-10 shrink-0 border-b ${isDarkMode ? "bg-[#1c1c1e] border-white/10" : "bg-white border-black/12 shadow-sm"}`}>
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className={`text-[28px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Recurring Expenses</h2>
              <p className={`text-[15px] mt-1 ${isDarkMode ? "text-white/50" : "text-black/65"}`}>Automate your regular expenses</p>
            </div>
            <button onClick={onClose} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
              <X className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`} />
            </button>
          </div>

          <div className="px-5 pb-4">
            <div className={`p-4 rounded-[14px] bg-gradient-to-br ${isDarkMode ? "from-blue-500/20 to-purple-500/20" : "from-blue-50 to-purple-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[13px] font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>Monthly Projection</p>
                <TrendingUp className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <p className={`text-[32px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>₹{monthlyProjection.toFixed(2)}</p>
              <p className={`text-[13px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{activeExpenses.length} active expense{activeExpenses.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5 pb-44 space-y-6">
            <div className="px-5">
              <button
                id="add-recurring-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('openRecurringModal'));
                }}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[17px] shadow-lg transition-all active:scale-[0.98] cursor-pointer hover:brightness-110 z-[1000] relative ${isDarkMode ? "bg-[#0a84ff] text-white" : "bg-[#007aff] text-white"}`}
                style={{ touchAction: "manipulation" }}
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span>Add Recurring Expense</span>
              </button>
            </div>

            {activeExpenses.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${isDarkMode ? "text-white/50" : "text-black/50"}`}>Active ({activeExpenses.length})</h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeExpenses.map((expense) => (
                      <RecurringExpenseItem
                        key={expense.id}
                        expense={expense}
                        isDarkMode={isDarkMode}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                        onProcessNow={handleProcessNow}
                        isDue={checkIsDue(calculateNextOccurrence(expense.startDate, expense.frequency, expense.lastGenerated))}
                        daysUntil={checkDaysUntil(calculateNextOccurrence(expense.startDate, expense.frequency, expense.lastGenerated))}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {pausedExpenses.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${isDarkMode ? "text-white/50" : "text-black/50"}`}>Paused ({pausedExpenses.length})</h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pausedExpenses.map((expense) => (
                      <RecurringExpenseItem
                        key={expense.id}
                        expense={expense}
                        isDarkMode={isDarkMode}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                        onProcessNow={handleProcessNow}
                        isDue={false}
                        daysUntil={0}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {!isLoading && recurringExpenses.length === 0 && (
              <div className="py-20 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                  <AlertCircle className={`w-8 h-8 opacity-20`} />
                </div>
                <p className={`text-[17px] opacity-40`}>No recurring expenses yet</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

interface RecurringExpenseItemProps {
  expense: RecurringExpense;
  isDarkMode: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onProcessNow: (expense: RecurringExpense) => void;
  isDue: boolean;
  daysUntil: number;
}

const RecurringExpenseItem = forwardRef<HTMLDivElement, RecurringExpenseItemProps>(
  ({ expense, isDarkMode, onToggleActive, onDelete, onProcessNow, isDue, daysUntil }, ref) => {
    const Icon = getCategoryIcon(expense.category);
    const color = getCategoryColor(expense.category);
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-sm"} ${isDue && expense.isActive ? (isDarkMode ? "border-orange-500/50 bg-orange-500/5" : "border-orange-200 bg-orange-50") : ""}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm ${!expense.isActive ? "grayscale opacity-50" : ""}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <h4 className={`text-[16px] sm:text-[17px] font-semibold truncate ${isDarkMode ? "text-white" : "text-black"} ${!expense.isActive ? "opacity-50" : ""}`}>{expense.description}</h4>
              <p className={`text-[16px] sm:text-[17px] font-bold tabular-nums flex-shrink-0 ${isDarkMode ? "text-white" : "text-black"} ${!expense.isActive ? "opacity-50" : ""}`}>₹{expense.amount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <p className={`text-[14px] sm:text-[15px] capitalize ${isDue && expense.isActive ? (isDarkMode ? "text-orange-400" : "text-orange-600") : (isDarkMode ? "text-white/50" : "text-black/50")}`}>{expense.frequency}</p>
              <span className={`text-[12px] opacity-30 ${isDarkMode ? "text-white" : "text-black"}`}>•</span>
              <p className={`text-[14px] sm:text-[15px] ${isDue && expense.isActive ? (isDarkMode ? "text-orange-400" : "text-orange-600") : (isDarkMode ? "text-white/50" : "text-black/50")}`}>In {daysUntil} days</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {expense.isActive && isDue && (
                <button onClick={() => onProcessNow(expense)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${isDarkMode ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}>Process Now</button>
              )}
              <div className="flex items-center gap-1.5">
                <button onClick={() => onToggleActive(expense.id)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${expense.isActive ? (isDarkMode ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200") : (isDarkMode ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-green-100 text-green-700 hover:bg-green-200")}`}>
                  {expense.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {expense.isActive ? "Pause" : "Resume"}
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('openRecurringModal', { detail: { expense } }))} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"}`}>
                  <Edit2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDarkMode ? "text-white/50" : "text-black/50"}`} />
                </button>
                <button onClick={() => onDelete(expense.id)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"}`}>
                  <Trash2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);
