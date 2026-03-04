import {
  BarChart3,
  Calendar,
  Download,
  HelpCircle,
  Moon,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Settings,
  Sun,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useMemo } from "react";
import { message } from "antd";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
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
import { ExportModal } from "./ExportModal";

import { UpcomingBillsWidget } from "./UpcomingBillsWidget";
import { SwipeableExpenseItem } from "./SwipeableExpenseItem";
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

interface AppMainProps {
  isDarkMode: boolean;
  themeMode: "light" | "dark" | "oled";
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
}

export function AppMain({
  isDarkMode,
  themeMode,
  onToggleDarkMode,
  onOpenSettings,
}: AppMainProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<UIExpense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budget, setBudgetData] = useState<Budget | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [addExpenseDate, setAddExpenseDate] = useState<Date | undefined>(
    undefined,
  );

  // Local UI states (not in URL)
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<UIExpense[]>(
    [],
  );

  // Helpers to check modal states from URL
  const isSearchOpen = location.pathname === "/search";
  const isAnalyticsOpen = location.pathname === "/analytics";
  const isCalendarOpen = location.pathname === "/calendar";
  const isSavingsGoalsOpen = location.pathname === "/savings";
  const isRecurringModalOpen = location.pathname === "/recurring";
  const isBillRemindersOpen = location.pathname === "/bill-reminders";
  const isHelpOpen = location.pathname === "/help";
  const isExportModalOpen = location.pathname === "/export";
  const isAddModalOpen = location.pathname === "/add-expense";
  const isEditModalOpen = location.pathname.startsWith("/edit-expense/");
  const isBudgetModalOpen = location.pathname === "/budget-settings";

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
        await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback even if queued
      }
    } catch (error) {
      console.error("[BUDGET] Failed to save budget:", error);
      // Trigger Haptics
      await Haptics.impact({ style: ImpactStyle.Light });

      // Keep local state updated even if save fails
    }
  };

  // Get today's date safely in LOCAL time, avoiding the UTC timezone shift
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  const allTodaysExpenses = expenses.filter((exp) => {
    if (!exp.date) return false;
    return exp.date === todayStr;
  });

  const availableCategories = Array.from(
    new Set(allTodaysExpenses.map((e) => e.category)),
  );

  const todaysExpenses = allTodaysExpenses.filter((exp) => {
    if (selectedCategory) return exp.category === selectedCategory;
    return true;
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
      if (!exp.date) return false;
      const parts = exp.date.split("-");
      if (parts.length < 2) return false;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed

      return month === currentMonthNum && year === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  const handleAddExpense = async (newExpense: {
    description: string;
    category: string;
    amount: number;
    expenseDateTime: string;
  }) => {
    const tempId = `temp-${Date.now()}`;

    const optDateObj = new Date(newExpense.expenseDateTime);
    const localDateStr = `${optDateObj.getFullYear()}-${String(
      optDateObj.getMonth() + 1,
    ).padStart(2, "0")}-${String(optDateObj.getDate()).padStart(2, "0")}`;

    const optimisticExpense: UIExpense = {
      id: tempId,
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,

      dateTime: newExpense.expenseDateTime,
      date: localDateStr,
      time: optDateObj.toLocaleTimeString("en-US", {
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
        await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback on successful add

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
      await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback even if queued
    }
  };

  const handleDateClick = (date: Date, dayExpenses: UIExpense[]) => {
    setSelectedDate(date);
    setSelectedDayExpenses(dayExpenses);
    setIsDailyPopupOpen(true);
  };

  const handleAddExpenseFromCalendar = (date: Date) => {
    setAddExpenseDate(date);
    navigate("/add-expense");
  };

  const handleEditExpense = (expense: UIExpense) => {
    setEditingExpense(expense);
    navigate(`/edit-expense/${expense.id}`);
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
        await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback on successful update
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
      await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback even if queued
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
        await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback on successful delete
      } catch (err) {
        console.error("🔴 Delete failed:", err);

        // 3️⃣ Rollback UI
        setExpenses(previousExpenses);
      }
    } else {
      // 📴 OFFLINE → local + queue
      deleteExpenseLocally(id);
      await Haptics.impact({ style: ImpactStyle.Light }); // Haptic feedback even if queued
    }
  };

  const handleRecurringExpense = (expense: UIExpense) => {
    setEditingExpense(expense);
    navigate("/recurring");
  };

  const handleSaveRecurring = (recurringExpense: UIExpense) => {
    const updatedExpenses = expenses.map((exp) => {
      if (exp.id === recurringExpense.id) {
        return recurringExpense;
      }
      return exp;
    });
    setExpenses(updatedExpenses);
    navigate("/");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredExpenses = expenses.filter((exp) => {
    return exp.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportToCSV = async (startDate?: string, endDate?: string) => {
    const start = startDate ?? "2000-01-01";
    const end = endDate ?? "2099-12-31";
    const filteredExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(start) && expDate <= new Date(end);
    });
    await exportToCSV(filteredExpenses, "kakeibo-expenses");
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
      className={`min-h-screen transition-colors duration-300 ${themeMode === "oled" ? "bg-[#000000]" : isDarkMode ? "bg-[#1a1a1a]" : "bg-[#f5f5f7]"}`}
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto px-6 pb-24 safe-top"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
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
                className={`text-[17px] ${isDarkMode ? "text-white/50" : "text-black/65"}`}
              >
                Track today. Plan tomorrow.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/help")}
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
                {themeMode === "oled" ? (
                  <Zap className="w-5 h-5 text-[#0a84ff]" strokeWidth={2.5} />
                ) : isDarkMode ? (
                  <Sun className="w-5 h-5 text-white" strokeWidth={2.5} />
                ) : (
                  <Moon className="w-5 h-5 text-black" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={() => navigate("/analytics")}
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
        {monthlyBudget > 0 && (
          <div className="mb-5">
            {monthTotal >= monthlyBudget * 0.8 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-3 p-4 rounded-[18px] mb-3 border ${
                  monthTotal >= monthlyBudget
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-bold">
                    {monthTotal >= monthlyBudget
                      ? "Limit Exceeded!"
                      : "Budget Warning"}
                  </p>
                  <p className="text-[12px] font-medium opacity-80">
                    {monthTotal >= monthlyBudget
                      ? "You have already spent your entire monthly budget."
                      : `You've used ${((monthTotal / monthlyBudget) * 100).toFixed(0)}% of your monthly budget.`}
                  </p>
                </div>
              </motion.div>
            )}
            <BudgetOverview
              monthlyBudget={monthlyBudget}
              currentSpending={monthTotal}
              onSetBudget={() => navigate("/budget-settings")}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Upcoming Bills Widget */}
        <UpcomingBillsWidget
          onOpenBills={() => navigate("/bill-reminders")}
          isDarkMode={isDarkMode}
        />

        {/* Recurring Expenses Widget */}
        <RecurringExpensesWidget
          onOpenRecurring={() => navigate("/recurring")}
          isDarkMode={isDarkMode}
        />

        {/* Highlighted Primary Add Expense Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/add-expense")}
          className="w-full mb-6 py-4 rounded-[20px] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] font-semibold text-[17px] text-white bg-gradient-to-br from-[#007aff] to-[#0051d5] hover:opacity-95 shadow-lg border border-transparent"
          style={{
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(10, 132, 255, 0.3)"
              : "0 8px 24px rgba(0, 122, 255, 0.3)",
          }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span className="tracking-wide">Add Expense</span>
        </motion.button>

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
            onClick={() => navigate("/recurring")}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10"
                : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"
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
            onClick={() => navigate("/savings")}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10"
                : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"
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
            onClick={() => navigate("/export")}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10"
                : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"
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
            onClick={() => navigate("/search")}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10"
                : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
            <span>Search</span>
          </motion.button>
        </motion.div>

        {/* Today's Expenses Section */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-[22px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Today's Expenses
            </h3>
            <span
              className={`text-[15px] font-bold ${isDarkMode ? "text-white/40" : "text-black/40"}`}
            >
              ₹{todayTotal.toFixed(2)}
            </span>
          </div>

          {/* Category Filter Pills (Feature 6) */}
          {availableCategories.length > 0 && (
            <div className="flex overflow-x-auto gap-2 pb-3 mb-4 no-scrollbar -mx-6 px-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? "bg-[#007aff] text-white shadow-md shadow-[#007aff]/20"
                    : themeMode === "oled"
                      ? "bg-[#000000] text-white/50 border border-white/20"
                      : isDarkMode
                        ? "bg-[#1c1c1e] text-white/50 border border-white/5"
                        : "bg-white text-black/65 border border-black/12 shadow-sm"
                }`}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap capitalize transition-all ${
                    selectedCategory === cat
                      ? "bg-[#007aff] text-white shadow-md shadow-[#007aff]/20"
                      : themeMode === "oled"
                        ? "bg-[#000000] text-white/50 border border-white/20"
                        : isDarkMode
                          ? "bg-[#1c1c1e] text-white/50 border border-white/5"
                          : "bg-white text-black/65 border border-black/12 shadow-sm"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className={`rounded-[20px] overflow-hidden shadow-sm border transition-colors ${
              themeMode === "oled"
                ? "bg-[#000000] border-white/15"
                : isDarkMode
                  ? "bg-[#1c1c1e] border-white/10"
                  : "bg-white border-black/5"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {todaysExpenses.length > 0 ? (
                todaysExpenses.map((expense, index) => {
                  const Icon = expense.icon;
                  return (
                    <SwipeableExpenseItem
                      key={expense.id}
                      onEdit={() => handleEditExpense(expense)}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      isDarkMode={isDarkMode}
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
                    </SwipeableExpenseItem>
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
                    No expenses matched
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* View Calendar Button */}
        <button
          onClick={() => navigate("/calendar")}
          className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] font-semibold text-[17px] border ${
            isDarkMode
              ? "bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white border-white/10"
              : "bg-white hover:bg-gray-50 text-[#007aff] border-black/12 shadow-sm"
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={2.5} />
          <span>View Past Expenses</span>
        </button>

        {/* Kakeibo Philosophy Quote */}
        <div className="mt-10 px-4">
          <div
            className={`p-4 border-b ${isDarkMode ? "border-white/10" : "border-black/12"}`}
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

      {isCalendarOpen && (
        <CalendarView
          expenses={expenses}
          onClose={() => navigate("/")}
          onDateClick={handleDateClick}
          isDarkMode={isDarkMode}
        />
      )}

      <DailyExpensePopup
        isOpen={isDailyPopupOpen}
        onClose={() => navigate("/")}
        onAddExpense={handleAddExpenseFromCalendar}
        date={selectedDate}
        expenses={selectedDayExpenses}
        isDarkMode={isDarkMode}
      />

      {isBudgetModalOpen && (
        <BudgetSettingsModal
          isOpen={isBudgetModalOpen}
          onClose={() => navigate("/")}
          currentBudget={monthlyBudget}
          onSaveBudget={handleSaveBudget}
          isDarkMode={isDarkMode}
        />
      )}

      {isAnalyticsOpen && (
        <AnalyticsView
          expenses={expenses}
          onClose={() => navigate("/")}
          isDarkMode={isDarkMode}
        />
      )}

      {isRecurringModalOpen && (
        <RecurringExpensesView
          onClose={() => navigate("/")}
          isDarkMode={isDarkMode}
          onAddExpense={handleAddExpense}
        />
      )}

      {isSavingsGoalsOpen && (
        <SavingsGoalsView
          onClose={() => navigate("/")}
          isDarkMode={isDarkMode}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => navigate("/")}
        onExport={handleExportToCSV}
        isDarkMode={isDarkMode}
      />

      {isSearchOpen && (
        <MobileSearchModal
          isOpen={isSearchOpen}
          onClose={() => navigate("/")}
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
          onClose={() => navigate("/")}
          isDarkMode={isDarkMode}
          onAddExpense={handleAddExpense}
        />
      )}

      {isHelpOpen && (
        <HelpView onClose={() => navigate("/")} isDarkMode={isDarkMode} />
      )}

      {/* Primary Modals (should be on top) */}
      {/* <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={async () => {
          // Trigger Haptics
          await Haptics.impact({ style: ImpactStyle.Light });

          setIsAddModalOpen(false);
          setAddExpenseDate(undefined);
        }}
        onAdd={handleAddExpense}
        isDarkMode={isDarkMode}
        initialDate={addExpenseDate}
      /> */}

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={async () => {
          await Haptics.impact({ style: ImpactStyle.Light });
          navigate("/");
          setAddExpenseDate(undefined);
        }}
        onAdd={handleAddExpense}
        isDarkMode={isDarkMode}
        initialDate={addExpenseDate}
      />

      {isEditModalOpen && editingExpense && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={async () => {
            // Trigger Haptics
            await Haptics.impact({ style: ImpactStyle.Light });

            navigate("/");
          }}
          expense={editingExpense}
          onSave={handleSaveEdit}
          onDelete={handleDeleteExpense}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
