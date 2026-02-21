import {
  BarChart3,
  Calendar,
  Download,
  HelpCircle,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Budget,
  createExpense,
  deleteExpense,
  getCurrentBudget,
  getExpenses,
  setBudget,
  updateExpense,
} from "../services/api";
import { UIExpense } from "../types/UIExpense";
import {
  exportToCSV,
  getCategoryIcon,
  getCurrentMonthRange,
} from "../utils/exportUtils";
import {
  deleteExpenseLocally,
  getBudgetLocally,
  getExpensesLocally,
  initializeSyncListeners,
  saveExpenseLocally,
  saveBudgetLocally,
  updateExpenseLocally,
} from "../utils/syncUtils";
import { AddExpenseModal } from "./AddExpenseModal";
import { AnalyticsView } from "./AnalyticsView";
import { BillRemindersView } from "./BillRemindersView";
import { BudgetOverview } from "./BudgetOverview";
import { BudgetSettingsModal } from "./BudgetSettingsModal";
import { CalendarView } from "./CalendarView";
import { DailyExpensePopup } from "./DailyExpensePopup";
import { EditExpenseModal } from "./EditExpenseModal";
import { HelpView } from "./HelpView";
import { MobileSearchModal } from "./MobileSearchModal";
import { RecurringExpensesView } from "./RecurringExpensesView";
import { RecurringExpensesWidget } from "./RecurringExpensesWidget";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { SearchFilters } from "./SearchFilters";
import { UpcomingBillsWidget } from "./UpcomingBillsWidget";
import {
  mapApiExpenseToUI,
  mapUIToBackendExpense,
} from "../utils/expenseMapper";

/**
 * Main App Component
 *
 * BACKEND INTEGRATION NOTES:
 * - On app load, check for JWT token and fetch user data
 * - If no token, show login screen
 * - Fetch all expenses, budgets, savings goals from backend APIs
 * - Implement localStorage as cache, sync with backend
 * - Handle offline mode with service workers
 *
 * OFFLINE-FIRST ARCHITECTURE:
 * - All operations happen on localStorage first (instant UI)
 * - Changes queued for backend sync
 * - Auto-sync when connection restored
 * - User sees instant feedback, no loading states
 */
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

export function AppMain({
  isDarkMode = false,
  onToggleDarkMode,
  onOpenSettings,
}: {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSettings?: () => void;
}) {
  const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<UIExpense[]>(
    [],
  );
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<UIExpense | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSavingsGoalsOpen, setIsSavingsGoalsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBillRemindersOpen, setIsBillRemindersOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budget, setBudgetData] = useState<Budget | null>(null);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get today's expenses
  useEffect(() => {
    (async () => {
      try {
        const current = await getCurrentBudget();
        setBudgetData(current);
        if (current && typeof current.monthlyAmount === "number") {
          setMonthlyBudget(current.monthlyAmount);
        }
      } catch (e) {
        console.error("Failed to load budget", e);
      } finally {
        setBudgetLoading(false);
      }
    })();
  }, []);

  const refreshBudget = async () => {
    const updated = await getCurrentBudget();
    setBudgetData(updated);
    if (updated && typeof updated.monthlyAmount === "number") {
      setMonthlyBudget(updated.monthlyAmount);
    }
  };

  const handleSaveBudget = async (amount: number) => {
    try {
      // 1️⃣ Update local state immediately (optimistic UI)
      setMonthlyBudget(amount);

      // 2️⃣ Save to backend if online
      if (navigator.onLine) {
        await setBudget(amount);
        console.log("[BUDGET] Saved budget to backend:", amount);
        await refreshBudget();
      } else {
        // 3️⃣ If offline, queue for sync
        const currentMonth = new Date().toISOString().slice(0, 7);
        saveBudgetLocally(amount, currentMonth);
        console.log("[BUDGET] Queued budget for sync:", amount);
      }
    } catch (error) {
      console.error("[BUDGET] Failed to save budget:", error);
      // Keep local state updated even if save fails
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const todaysExpenses = expenses.filter((exp) => {
    if (!exp.date) return false;

    const expDateObj = new Date(exp.date);
    if (isNaN(expDateObj.getTime())) return false;

    return expDateObj.toISOString().split("T")[0] === todayStr;
  });

  const todayTotal = todaysExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  // Get current month total
  const currentMonthNum = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotal = expenses
    .filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        expDate.getMonth() === currentMonthNum &&
        expDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  const handleAddExpense = async (newExpense: {
    description: string;
    category: string;
    amount: number;
    expenseDateTime: string;
  }) => {
    const tempId = `temp-${Date.now()}`;

    const optimisticExpense: UIExpense = {
      id: tempId,
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,

      dateTime: newExpense.expenseDateTime,
      date: newExpense.expenseDateTime.split("T")[0],
      time: new Date(newExpense.expenseDateTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),

      icon: getCategoryIcon(newExpense.category),
      color: getCategoryColor(newExpense.category),
      syncStatus: navigator.onLine ? "synced" : "pending",
    };

    // 1️⃣ Optimistic UI update (ALWAYS)
    setExpenses((prev) => [optimisticExpense, ...prev]);

    // 2️⃣ Decide based on connectivity
    if (navigator.onLine) {
      try {
        // ✅ ONLINE → backend is source of truth
        const saved = await createExpense({
          description: newExpense.description,
          category: newExpense.category,
          amount: newExpense.amount,
          expenseDateTime: newExpense.expenseDateTime,
        });

        const savedUI = mapApiExpenseToUI(saved);

        setExpenses((prev) => prev.map((e) => (e.id === tempId ? savedUI : e)));

        await refreshBudget();
      } catch (err) {
        console.error("🔴 Create expense failed:", err);

        setExpenses((prev) =>
          prev.map((e) =>
            e.id === tempId ? { ...e, syncStatus: "failed" } : e,
          ),
        );
      }
    } else {
      // 📴 OFFLINE → localStorage + sync queue
      saveExpenseLocally(optimisticExpense);
    }
  };

  const handleDateClick = (date: Date, dayExpenses: UIExpense[]) => {
    setSelectedDate(date);
    setSelectedDayExpenses(dayExpenses);
    setIsDailyPopupOpen(true);
  };

  const handleEditExpense = (expense: UIExpense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedExpense: UIExpense) => {
    // 1️⃣ Optimistic UI update
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)),
    );

    if (navigator.onLine) {
      try {
        // 2️⃣ ONLINE → backend
        await updateExpense(
          updatedExpense.id,
          mapUIToBackendExpense(updatedExpense),
        );
      } catch (err) {
        console.error("🔴 Update failed:", err);

        // 3️⃣ Mark failed sync
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === updatedExpense.id ? { ...e, syncStatus: "failed" } : e,
          ),
        );
      }
    } else {
      // 📴 OFFLINE → local + queue
      updateExpenseLocally(updatedExpense);
    }
  };
  const handleDeleteExpense = async (id: string) => {
    const previousExpenses = expenses;

    // 1️⃣ Optimistic UI delete
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (navigator.onLine) {
      try {
        // 2️⃣ ONLINE → backend
        await deleteExpense(id);
      } catch (err) {
        console.error("🔴 Delete failed:", err);

        // 3️⃣ Rollback UI
        setExpenses(previousExpenses);
      }
    } else {
      // 📴 OFFLINE → local + queue
      deleteExpenseLocally(id);
    }
  };

  const handleRecurringExpense = (expense: UIExpense) => {
    setEditingExpense(expense);
    setIsRecurringModalOpen(true);
  };

  const handleSaveRecurring = (recurringExpense: UIExpense) => {
    const updatedExpenses = expenses.map((exp) => {
      if (exp.id === recurringExpense.id) {
        return recurringExpense;
      }
      return exp;
    });
    setExpenses(updatedExpenses);
    setIsRecurringModalOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredExpenses = expenses.filter((exp) => {
    return exp.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportToCSV = () => {
    const { startDate, endDate } = getCurrentMonthRange();
    const filteredExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(startDate) && expDate <= new Date(endDate);
    });
    exportToCSV(filteredExpenses, "expenses.csv");
  };

  useEffect(() => {
    // Initialize sync listeners
    initializeSyncListeners(() => {
      // Reload expenses when sync completes
      const syncedExpenses = getExpensesLocally();
      // Map expenses to include icon and color based on category
      const mappedExpenses = syncedExpenses.map((exp) => ({
        ...exp,
        icon: getCategoryIcon(exp.category),
        color: getCategoryColor(exp.category),
        time: new Date(exp.date).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }));
      setExpenses(mappedExpenses);
    });

    // // Load initial expenses from localStorage
    // const storedExpenses = getExpensesLocally();
    // if (storedExpenses.length > 0) {
    //   // Map expenses to include icon and color based on category
    //   const mappedExpenses = storedExpenses.map((exp) => ({
    //     ...exp,
    //     icon: getCategoryIcon(exp.category),
    //     color: getCategoryColor(exp.category),
    //     time: new Date(exp.date).toLocaleTimeString("en-US", {
    //       hour: "numeric",
    //       minute: "2-digit",
    //       hour12: true,
    //     }),
    //   }));
    //   setExpenses(mappedExpenses);
    // } else {
    //   // Use initial mock data
    //   setExpenses(initialExpenses);
    //   // Save to localStorage
    //   initialExpenses.forEach((exp) => saveExpenseLocally(exp));
    // }

    // Load budget from localStorage
    const storedBudget = getBudgetLocally();
    if (storedBudget !== null) {
      setMonthlyBudget(storedBudget);
    }

    // Fetch expenses from backend on initial load (if available)
    (async () => {
      try {
        const apiExpenses = await getExpenses();
        if (Array.isArray(apiExpenses) && apiExpenses.length > 0) {
          // Map API expenses to UI model
          const mapped = apiExpenses.map((e) => {
            const ui = mapApiExpenseToUI(e as any);
            return ui;
          });
          setExpenses(mapped);

          // Save to localStorage for offline use
          apiExpenses.forEach((exp) => {
            try {
              saveExpenseLocally(exp as any);
            } catch (err) {
              // ignore local save errors
            }
          });
        }
      } catch (err) {
        console.warn("Could not fetch expenses from backend:", err);
      }
    })();
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto px-5 py-6 safe-area-inset"
      >
        {/* Header */}
        <header className="mb-5">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1
                className={`text-[34px] font-bold tracking-tight leading-tight mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Kakeibo
              </h1>
              <p
                className={`text-[17px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                Track today. Plan tomorrow.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHelpOpen(true)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode
                    ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                    : "bg-white hover:bg-[#f5f5f7]"
                }`}
              >
                <HelpCircle
                  className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                  strokeWidth={2.5}
                />
              </button>
              <button
                onClick={() => onToggleDarkMode && onToggleDarkMode()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode
                    ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                    : "bg-white hover:bg-[#f5f5f7]"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-white" strokeWidth={2.5} />
                ) : (
                  <Moon className="w-5 h-5 text-black" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode
                    ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                    : "bg-white hover:bg-[#f5f5f7]"
                }`}
              >
                <BarChart3
                  className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                  strokeWidth={2.5}
                />
              </button>
              <button
                onClick={() => onOpenSettings && onOpenSettings()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode
                    ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                    : "bg-white hover:bg-[#f5f5f7]"
                }`}
              >
                <Settings
                  className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 shadow-lg"
          >
            <p className="text-white/80 text-[13px] font-semibold mb-1 uppercase tracking-wider">
              {currentMonth}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-[48px] font-bold tracking-tighter">
                ₹{monthTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-[15px]">Total Spent This Month</p>
          </motion.div>
        </header>

        {/* Budget Overview - Merged Component (Compact + Expandable) */}
        <BudgetOverview
          monthlyBudget={monthlyBudget}
          currentSpending={monthTotal}
          onSetBudget={() => setIsBudgetModalOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Upcoming Bills Widget */}
        <UpcomingBillsWidget
          onOpenBills={() => setIsBillRemindersOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Recurring Expenses Widget */}
        <RecurringExpensesWidget
          onOpenRecurring={() => setIsRecurringModalOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 mb-5 shadow-sm active:scale-[0.97] font-semibold text-[17px] ${
            isDarkMode
              ? "bg-white hover:bg-white/90 text-black"
              : "bg-black hover:bg-black/90 text-white"
          }`}
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          <span>Add Expense</span>
        </button>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2,
              },
            },
          }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <motion.button
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            onClick={() => setIsRecurringModalOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Repeat className="w-4 h-4" strokeWidth={2.5} />
            <span>Recurring</span>
          </motion.button>
          <motion.button
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            onClick={() => setIsSavingsGoalsOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Target className="w-4 h-4" strokeWidth={2.5} />
            <span>Savings</span>
          </motion.button>
          <motion.button
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            onClick={handleExportToCSV}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            <span>Export</span>
          </motion.button>
          <motion.button
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            onClick={() => setIsSearchOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
            <span>Search</span>
          </motion.button>
        </motion.div>

        {/* Today's Expenses Section */}
        <section className="mb-5">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={`text-[28px] font-bold mb-4 tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Today
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className={`backdrop-blur-xl rounded-[20px] overflow-hidden shadow-sm border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 border-white/10"
                : "bg-white/80 border-black/5"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {todaysExpenses.length > 0 ? (
                todaysExpenses.map((expense, index) => {
                  const Icon = expense.icon;
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.4 + index * 0.05,
                      }}
                    >
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className={`w-full p-4 flex items-center gap-3.5 transition-colors cursor-pointer text-left ${
                          isDarkMode
                            ? "active:bg-white/5 hover:bg-white/3"
                            : "active:bg-black/5 hover:bg-black/3"
                        }`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <Icon
                            className="w-5 h-5 text-white"
                            strokeWidth={2.5}
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[17px] font-semibold mb-0.5 ${isDarkMode ? "text-white" : "text-black"}`}
                          >
                            {expense.description}
                          </p>
                          <p
                            className={`text-[15px] ${isDarkMode ? "text-white/45" : "text-black/45"}`}
                          >
                            {expense.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}
                          >
                            ₹{expense.amount.toFixed(2)}
                          </p>
                        </div>
                      </button>
                      {index < todaysExpenses.length - 1 && (
                        <div
                          className={`h-[0.5px] ml-16 ${isDarkMode ? "bg-white/10" : "bg-black/8"}`}
                        ></div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="p-10 text-center"
                >
                  <p
                    className={`text-[17px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                  >
                    No expenses today
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* View Calendar Button */}
        <button
          onClick={() => setIsCalendarOpen(true)}
          className={`w-full backdrop-blur-xl py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] font-semibold text-[17px] border ${
            isDarkMode
              ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
              : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={2.5} />
          <span>View Past Expenses</span>
        </button>

        {/* Kakeibo Philosophy Quote */}
        <div className="mt-10 px-4">
          <div
            className={`border-t pt-6 ${isDarkMode ? "border-white/10" : "border-black/8"}`}
          >
            <p
              className={`text-[15px] text-center leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              "Before you buy, ask yourself:
              <br />
              Will this bring me joy?"
            </p>
            <p
              className={`text-[13px] text-center mt-2 font-medium ${isDarkMode ? "text-white/30" : "text-black/30"}`}
            >
              — Kakeibo Philosophy
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExpense}
        isDarkMode={isDarkMode}
      />

      {isCalendarOpen && (
        <CalendarView
          expenses={expenses}
          onClose={() => setIsCalendarOpen(false)}
          onDateClick={handleDateClick}
          isDarkMode={isDarkMode}
        />
      )}

      <DailyExpensePopup
        isOpen={isDailyPopupOpen}
        onClose={() => setIsDailyPopupOpen(false)}
        date={selectedDate}
        expenses={selectedDayExpenses}
        isDarkMode={isDarkMode}
      />

      {isBudgetModalOpen && (
        <BudgetSettingsModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          currentBudget={monthlyBudget}
          onSaveBudget={handleSaveBudget}
          isDarkMode={isDarkMode}
        />
      )}

      {isAnalyticsOpen && (
        <AnalyticsView
          expenses={expenses}
          onClose={() => setIsAnalyticsOpen(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {isEditModalOpen && editingExpense && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          expense={editingExpense}
          onSave={handleSaveEdit}
          onDelete={handleDeleteExpense}
          isDarkMode={isDarkMode}
        />
      )}

      {isRecurringModalOpen && (
        <RecurringExpensesView
          onClose={() => setIsRecurringModalOpen(false)}
          isDarkMode={isDarkMode}
          onAddExpense={handleAddExpense}
        />
      )}

      {isSavingsGoalsOpen && (
        <SavingsGoalsView
          onClose={() => setIsSavingsGoalsOpen(false)}
          isDarkMode={isDarkMode}
        />
      )}

      <SearchFilters
        onSearch={handleSearch}
        onFilter={(filters) => {
          // TODO: BACKEND INTEGRATION - Apply filters via API
          console.log("Filters applied:", filters);
        }}
        isDarkMode={isDarkMode}
      />

      {isSearchOpen && (
        <MobileSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          expenses={filteredExpenses}
          onSelectExpense={(expense) => {
            // When user selects an expense from search, open edit modal
            const uiExpense: UIExpense = {
              ...expense,
              icon: getCategoryIcon(expense.category),
              color: getCategoryColor(expense.category),
              time: new Date(expense.date).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              dateTime: "",
            };
            handleEditExpense(uiExpense);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {isBillRemindersOpen && (
        <BillRemindersView
          onClose={() => setIsBillRemindersOpen(false)}
          isDarkMode={isDarkMode}
          onAddExpense={handleAddExpense}
        />
      )}

      {isHelpOpen && (
        <HelpView
          onClose={() => setIsHelpOpen(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
