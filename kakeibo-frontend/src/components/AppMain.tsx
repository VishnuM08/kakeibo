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
  Smartphone,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { WalkthroughTour } from "./WalkthroughTour";
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
  createRecurringExpense,
  updateRecurringExpense,
  RecurringExpense
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
import { SMSTransactionsView } from "./SMSTransactionsView";
import { UpcomingBillsWidget } from "./UpcomingBillsWidget";
import { SwipeableExpenseItem } from "./SwipeableExpenseItem";
import {
  mapApiExpenseToUI,
  mapUIToBackendExpense,
} from "../utils/expenseMapper";
import { ParsedTransaction, getMockSMSTransactions } from "../utils/smsParser";
import { AddRecurringExpenseModal } from "./AddRecurringExpenseModal";
import { BudgetOverviewDetails } from "./BudgetOverviewDetails";

/**
 * Main App Component
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
  const [isLoading, setIsLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budget, setBudgetData] = useState<Budget | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [addExpenseDate, setAddExpenseDate] = useState<Date | undefined>(
    undefined,
  );

  // Local UI states (not in URL)
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [isBudgetOverviewExpanded, setIsBudgetOverviewExpanded] = useState(false);
  const [budgetOverviewData, setBudgetOverviewData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<UIExpense[]>(
    [],
  );

  // Track if walkthrough is running to force-render empty states
  const [isTourActive, setIsTourActive] = useState(false);
  const [prefillData, setPrefillData] = useState<{ amount: number; description: string; category: string } | null>(null);

  // Tab State
  const [activeTab, setActiveTab ] = useState<'home' | 'sms' | 'stats' | 'bills'>('home');
  const [smsTransactions, setSmsTransactions] = useState<ParsedTransaction[]>(getMockSMSTransactions());

  // Global Recurring Modal State
  const [isGlobalRecurringModalOpen, setIsGlobalRecurringModalOpen] = useState(false);
  const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpense | undefined>(undefined);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const apiExpenses = await getExpenses();
      if (Array.isArray(apiExpenses)) {
        const mapped = apiExpenses.map((e) => mapApiExpenseToUI(e as any));
        setExpenses(mapped);
        localStorage.setItem("kakeibo_expenses", JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn("Could not fetch expenses from backend:", err);
      const stored = getExpensesLocally();
      if (stored.length > 0) setExpenses(stored);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for global events
  useEffect(() => {
    const handleOpenModal = (event: any) => {
      const { expense } = event.detail || {};
      setSelectedRecurringExpense(expense);
      setIsGlobalRecurringModalOpen(true);
    };

    const handleRefresh = () => fetchExpenses();

    window.addEventListener('openRecurringModal', handleOpenModal);
    window.addEventListener('recurringExpenseChanged', handleRefresh);
    
    return () => {
      window.removeEventListener('openRecurringModal', handleOpenModal);
      window.removeEventListener('recurringExpenseChanged', handleRefresh);
    };
  }, []);

  // Sync activeTab with URL routing
  useEffect(() => {
    if (location.pathname === "/recurring") {
      setActiveTab("bills");
    } else if (location.pathname === "/analytics") {
      setActiveTab("stats");
    } else if (location.pathname === "/bill-reminders") {
      setActiveTab("bills");
    } else if (location.pathname === "/") {
      setActiveTab("home");
    }
  }, [location.pathname]);

  // Initial Data Load
  useEffect(() => {
    fetchExpenses();
    initializeSyncListeners();

    (async () => {
      try {
        const current = await getCurrentBudget();
        setBudgetData(current);
        if (current && typeof current.monthlyAmount === "number") {
          setMonthlyBudget(current.monthlyAmount);
        }
      } catch (e) {
        console.error("Failed to load budget", e);
        const storedBudget = getBudgetLocally();
        if (storedBudget !== null) setMonthlyBudget(storedBudget);
      } finally {
        setBudgetLoading(false);
      }
    })();
  }, []);

  // Helpers to check modal states from URL
  const isSearchOpen = location.pathname === "/search";
  const isAnalyticsOpen = location.pathname === "/analytics";
  const isCalendarOpen = location.pathname === "/calendar";
  const isSavingsGoalsOpen = location.pathname === "/savings";
  const isBillRemindersOpen = location.pathname === "/bill-reminders";
  const isHelpOpen = location.pathname === "/help";
  const isExportModalOpen = location.pathname === "/export";
  const isAddModalOpen = location.pathname === "/add-expense";
  const isEditModalOpen = location.pathname.startsWith("/edit-expense/");
  const isBudgetModalOpen = location.pathname === "/budget-settings";

  // Unified flag for all full-page overlays
  const isAnyOverlayOpen = 
    isSearchOpen || 
    isAnalyticsOpen || 
    isCalendarOpen || 
    isSavingsGoalsOpen || 
    isBillRemindersOpen || 
    isHelpOpen || 
    isExportModalOpen || 
    isAddModalOpen || 
    isEditModalOpen || 
    isBudgetModalOpen || 
    isDailyPopupOpen ||
    isGlobalRecurringModalOpen ||
    isBudgetOverviewExpanded;


  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const refreshBudget = async () => {
    const updated = await getCurrentBudget();
    setBudgetData(updated);
    if (updated && typeof updated.monthlyAmount === "number") {
      setMonthlyBudget(updated.monthlyAmount);
    }
  };

  const handleSaveBudget = async (amount: number) => {
    try {
      setMonthlyBudget(amount);
      const currentMonth = new Date().toISOString().slice(0, 7);
      saveBudgetLocally(amount, currentMonth);

      if (navigator.onLine) {
        await setBudget(amount);
        await refreshBudget();
      }
    } catch (error) {
      console.error("[BUDGET] Failed to save budget:", error);
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  const allTodaysExpenses = expenses.filter((exp) => exp.date === todayStr);

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

  const currentMonthNum = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotal = expenses
    .filter((exp) => {
      if (!exp.date) return false;
      const parts = exp.date.split("-");
      if (parts.length < 2) return false;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
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
    const dateStr = newExpense.expenseDateTime || new Date().toISOString();
    const optDateObj = new Date(dateStr);
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

    setExpenses((prev) => [optimisticExpense, ...prev]);

    if (navigator.onLine) {
      try {
        const saved = await createExpense(newExpense);
        const savedUI = mapApiExpenseToUI(saved);
        setExpenses((prev) => prev.map((e) => (e.id === tempId ? savedUI : e)));
        await Haptics.impact({ style: ImpactStyle.Light });
        await refreshBudget();
      } catch (err) {
        console.error("🔴 Create expense failed:", err);
        setExpenses((prev) => prev.map((e) => (e.id === tempId ? { ...e, syncStatus: "failed" } : e)));
      }
    } else {
      saveExpenseLocally(optimisticExpense);
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const handleDateClick = (date: Date, dayExpenses: UIExpense[]) => {
    setSelectedDate(date);
    setSelectedDayExpenses(dayExpenses);
    setIsDailyPopupOpen(true);
  };

  const handleAddExpenseFromCalendar = (date: Date) => {
    setIsDailyPopupOpen(false);
    setAddExpenseDate(date);
    navigate("/add-expense");
  };

  const handleEditExpense = (expense: UIExpense) => {
    setEditingExpense(expense);
    navigate(`/edit-expense/${expense.id}`);
  };

  const handleSaveEdit = async (updatedExpense: UIExpense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    if (navigator.onLine) {
      try {
        await updateExpense(updatedExpense.id, mapUIToBackendExpense(updatedExpense));
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        console.error("🔴 Update failed:", err);
      }
    } else {
      updateExpenseLocally(updatedExpense);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const previousExpenses = expenses;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (navigator.onLine) {
      try {
        await deleteExpense(id);
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        console.error("🔴 Delete failed:", err);
        setExpenses(previousExpenses);
      }
    } else {
      deleteExpenseLocally(id);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    return exp.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportToCSV = async (startDate?: string, endDate?: string) => {
    const start = startDate ?? "2000-01-01";
    const end = endDate ?? "2099-12-31";
    const filtered = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(start) && expDate <= new Date(end);
    });
    await exportToCSV(filtered, "kakeibo-expenses");
  };

  const markSMSAsProcessed = (smsHash: string) => {
    setSmsTransactions((prev) =>
      prev.map((t) => (t.rawHash === smsHash ? { ...t, isApproved: true, isProcessed: true } : t)),
    );
  };

  const handleApproveSMS = (sms: ParsedTransaction) => {
    handleAddExpense({
      description: sms.merchant,
      category: sms.category,
      amount: sms.amount,
      expenseDateTime: sms.date.toISOString(),
    });
    markSMSAsProcessed(sms.rawHash);
    message.success("Transaction Approved");
  };

  const handleRejectSMS = (sms: ParsedTransaction) => {
    setSmsTransactions((prev) =>
      prev.map((t) => (t.rawHash === sms.rawHash ? { ...t, isRejected: true, isProcessed: true } : t)),
    );
    message.info("Transaction Ignored");
  };

  return (
    <>
      <WalkthroughTour activeTab={activeTab} isDarkMode={isDarkMode} />

      <AnimatePresence mode="wait">
        {activeTab === "home" && !isAnyOverlayOpen ? (
          <motion.div
            key="home-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 min-h-screen z-[100] overflow-y-auto no-scrollbar"
            style={{
              backgroundColor: isDarkMode
                ? (themeMode === 'oled' ? "#000000" : "#1c1c1e")
                : "#f5f5f7",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
            }}
          >
            <div className="max-w-lg mx-auto px-6 pb-24 safe-top" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
              {/* Header */}
              <header className="mb-5">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between mb-6"
                >
                  <div>
                    <h1 className={`text-[34px] font-bold tracking-tight leading-tight mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>
                      Kakeibo
                    </h1>
                    <p className={`text-[17px] ${isDarkMode ? "text-white/50" : "text-black/65"}`}>
                      Track today. Plan tomorrow.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate("/help")} className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]" : "bg-white hover:bg-[#f5f5f7]"}`}>
                      <HelpCircle className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => onToggleDarkMode?.()} className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]" : "bg-white hover:bg-[#f5f5f7]"}`}>
                      {themeMode === "oled" ? <Zap className="w-5 h-5 text-[#0a84ff]" strokeWidth={2.5} /> : isDarkMode ? <Sun className="w-5 h-5 text-white" strokeWidth={2.5} /> : <Moon className="w-5 h-5 text-black" strokeWidth={2.5} />}
                    </button>
                    <button onClick={() => setActiveTab("stats")} className={`w-11 h-11 analytics-section rounded-full flex items-center justify-center transition-colors shadow-sm ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]" : "bg-white hover:bg-[#f5f5f7]"}`}>
                      <BarChart3 className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => onOpenSettings?.()} className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]" : "bg-white hover:bg-[#f5f5f7]"}`}>
                      <Settings className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 shadow-lg dashboard-overview"
                >
                  <p className="text-white/80 text-[13px] font-semibold mb-1 uppercase tracking-wider">{currentMonth}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-white text-[48px] font-bold tracking-tighter">₹{monthTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-white/70 text-[15px]">Total Spent This Month</p>
                </motion.div>
              </header>

              <div className="mb-5 budget-section">
                {monthlyBudget !== null && monthlyBudget > 0 && monthTotal >= monthlyBudget * 0.8 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-center gap-3 p-4 rounded-[18px] mb-3 border ${monthTotal >= monthlyBudget ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-red-50 border-red-200 text-red-600"}`}>
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[14px] font-bold">{monthTotal >= monthlyBudget ? "Limit Exceeded!" : "Budget Warning"}</p>
                      <p className="text-[12px] font-medium opacity-80">{monthTotal >= monthlyBudget ? "You have already spent your entire monthly budget." : `You've used ${((monthTotal / monthlyBudget) * 100).toFixed(0)}% of your monthly budget.`}</p>
                    </div>
                  </motion.div>
                )}
                <BudgetOverview 
                  monthlyBudget={monthlyBudget} 
                  currentSpending={monthTotal} 
                  onSetBudget={() => navigate("/budget-settings")}
                  onExpand={(data) => {
                    setBudgetOverviewData(data);
                    setIsBudgetOverviewExpanded(true);
                  }}
                  isDarkMode={isDarkMode} 
                />
              </div>




              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate("/add-expense")}
                className="w-full mb-6 py-4 add-expense-btn rounded-[20px] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] font-semibold text-[17px] text-white bg-gradient-to-br from-[#007aff] to-[#0051d5] hover:opacity-95 shadow-lg border border-transparent"
                style={{ boxShadow: isDarkMode ? "0 8px 24px rgba(10, 132, 255, 0.3)" : "0 8px 24px rgba(0, 122, 255, 0.3)" }}
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                <span className="tracking-wide">Add Expense</span>
              </motion.button>

              <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }} className="grid grid-cols-2 gap-3 mb-8">
                <motion.button variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onClick={() => setActiveTab("bills")} className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10" : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"}`}>
                  <Repeat className="w-4 h-4" strokeWidth={2.5} />
                  <span>Recurring</span>
                </motion.button>
                <motion.button variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onClick={() => navigate("/savings")} className={`py-3 px-4 savings-section rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10" : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"}`}>
                  <Target className="w-4 h-4" strokeWidth={2.5} />
                  <span>Savings</span>
                </motion.button>
                <motion.button variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onClick={() => navigate("/export")} className={`py-3 px-4 export-section rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10" : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"}`}>
                  <Download className="w-4 h-4" strokeWidth={2.5} />
                  <span>Export</span>
                </motion.button>
                <motion.button variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onClick={() => navigate("/search")} className={`py-3 px-4 search-section rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#0a84ff] border-white/10" : "bg-white hover:bg-[#f5f5f7] text-[#007aff] border-black/12"}`}>
                  <Search className="w-4 h-4" strokeWidth={2.5} />
                  <span>Search</span>
                </motion.button>
              </motion.div>

              <div className="mt-2 mb-6 upcoming-bills-section">
                <UpcomingBillsWidget onOpenBills={() => setActiveTab("bills")} isDarkMode={isDarkMode} />
              </div>

              <section className="mb-5 todays-expenses-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-[22px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Today's Expenses</h3>
                  <span className={`text-[15px] font-bold ${isDarkMode ? "text-white/40" : "text-black/40"}`}>₹{todayTotal.toFixed(2)}</span>
                </div>

                {availableCategories.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 pb-3 mb-4 no-scrollbar -mx-6 px-6">
                    <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${selectedCategory === null ? "bg-[#007aff] text-white shadow-md shadow-[#007aff]/20" : themeMode === "oled" ? "bg-[#000000] text-white/50 border border-white/20" : isDarkMode ? "bg-[#1c1c1e] text-white/50 border border-white/5" : "bg-white text-black/65 border border-black/12 shadow-sm"}`}>All</button>
                    {availableCategories.map((cat) => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap capitalize transition-all ${selectedCategory === cat ? "bg-[#007aff] text-white shadow-md shadow-[#007aff]/20" : themeMode === "oled" ? "bg-[#000000] text-white/50 border border-white/20" : isDarkMode ? "bg-[#1c1c1e] text-white/50 border border-white/5" : "bg-white text-black/65 border border-black/12 shadow-sm"}`}>{cat}</button>
                    ))}
                  </div>
                )}
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className={`rounded-[20px] overflow-hidden shadow-sm border transition-colors ${themeMode === "oled" ? "bg-[#000000] border-white/15" : isDarkMode ? "bg-[#1c1c1e] border-white/10" : "bg-white border-black/5"}`}>
                  <AnimatePresence mode="popLayout">
                    {todaysExpenses.length > 0 ? (
                      todaysExpenses.map((expense, index) => {
                        const Icon = expense.icon;
                        return (
                          <SwipeableExpenseItem key={expense.id} onEdit={() => handleEditExpense(expense)} onDelete={() => handleDeleteExpense(expense.id)} isDarkMode={isDarkMode}>
                            <button onClick={() => handleEditExpense(expense)} className={`w-full p-4 flex items-center gap-3.5 transition-colors cursor-pointer text-left ${isDarkMode ? "active:bg-white/5 hover:bg-white/3" : "active:bg-black/5 hover:bg-black/3"}`}>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-12 h-12 rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[17px] font-semibold mb-0.5 ${isDarkMode ? "text-white" : "text-black"}`}>{expense.description}</p>
                                <p className={`text-[15px] ${isDarkMode ? "text-white/45" : "text-black/45"}`}>{expense.time}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-[20px] font-bold tabular-nums ${isDarkMode ? "text-white" : "text-black"}`}>₹{expense.amount.toFixed(2)}</p>
                              </div>
                            </button>
                            {index < todaysExpenses.length - 1 && <div className={`h-[0.5px] ml-16 ${isDarkMode ? "bg-white/10" : "bg-black/8"}`}></div>}
                          </SwipeableExpenseItem>
                        );
                      })
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }} className="p-10 text-center">
                        <p className={`text-[17px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>No expenses yet today</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </section>

              <button onClick={() => navigate("/calendar")} className={`w-full py-[15px] px-6 calendar-section rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] font-semibold text-[17px] border ${isDarkMode ? "bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white border-white/10" : "bg-white hover:bg-gray-50 text-[#007aff] border-black/12 shadow-sm"}`}>
                <Calendar className="w-5 h-5" strokeWidth={2.5} />
                <span>View Past Expenses</span>
              </button>

              <div className="mt-10 px-4">
                <div className={`p-4 border-b ${isDarkMode ? "border-white/10" : "border-black/12"}`}>
                  <p className={`text-[15px] text-center leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                    "Before you buy, ask yourself:<br />Will this bring me joy?"
                  </p>
                  <p className={`text-[13px] text-center mt-2 font-medium ${isDarkMode ? "text-white/30" : "text-black/30"}`}>— Kakeibo Philosophy</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === "sms" && !isAnyOverlayOpen ? (
          <motion.div
            key="sms-tab"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 min-h-screen z-[100] overflow-y-auto"
            style={{
              backgroundColor: isDarkMode ? "#000000" : "#f5f5f7",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
            }}
          >
            <SMSTransactionsView
              transactions={smsTransactions}
              onApprove={handleApproveSMS}
              onReject={handleRejectSMS}
              isDarkMode={isDarkMode}
              onBack={() => setActiveTab("home")}
            />
          </motion.div>
        ) : activeTab === "stats" && !isAnyOverlayOpen ? (
          <motion.div
            key="stats-tab"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 min-h-screen z-[100] overflow-y-auto"
            style={{
              backgroundColor: isDarkMode ? "#000000" : "#f5f5f7",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
            }}
          >
            <AnalyticsView
              expenses={expenses}
              onClose={() => setActiveTab("home")}
              isDarkMode={isDarkMode}
            />
          </motion.div>
        ) : (activeTab === "bills") && !isAnyOverlayOpen ? (
          <motion.div
            key="bills-tab"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 min-h-screen z-[100] overflow-y-auto"
            style={{
              backgroundColor: isDarkMode ? "#000000" : "#f5f5f7",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
            }}
          >
            <RecurringExpensesView
              onClose={() => setActiveTab("home")}
              isDarkMode={isDarkMode}
              onAddExpense={handleAddExpense}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCalendarOpen && (
          <CalendarView
            key="calendar-view"
            expenses={expenses}
            onClose={() => navigate("/")}
            onDateClick={handleDateClick}
            isDarkMode={isDarkMode}
          />
        )}

        {isDailyPopupOpen && (
          <DailyExpensePopup
            key="daily-expense-popup"
            isOpen={isDailyPopupOpen}
            onClose={() => setIsDailyPopupOpen(false)}
            onAddExpense={handleAddExpenseFromCalendar}
            date={selectedDate!}
            expenses={selectedDayExpenses}
            isDarkMode={isDarkMode}
            onApproveSMS={handleApproveSMS}
          />
        )}

        {isBudgetModalOpen && (
          <BudgetSettingsModal
            key="budget-settings-modal"
            isOpen={isBudgetModalOpen}
            onClose={() => navigate("/")}
            currentBudget={monthlyBudget}
            onSaveBudget={handleSaveBudget}
            isDarkMode={isDarkMode}
          />
        )}

        {isSavingsGoalsOpen && (
          <SavingsGoalsView
            key="savings-goals-view"
            onClose={() => navigate("/")}
            isDarkMode={isDarkMode}
          />
        )}

        {isExportModalOpen && (
          <ExportModal
            key="export-modal"
            isOpen={isExportModalOpen}
            onClose={() => navigate("/")}
            onExport={handleExportToCSV}
            isDarkMode={isDarkMode}
          />
        )}

        {isSearchOpen && (
          <MobileSearchModal
            key="mobile-search-modal"
            isOpen={isSearchOpen}
            onClose={() => navigate("/")}
            expenses={filteredExpenses}
            onSelectExpense={(expense) => {
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
            key="bill-reminders-view"
            onClose={() => navigate("/")}
            isDarkMode={isDarkMode}
            onAddExpense={handleAddExpense}
          />
        )}

        {isHelpOpen && (
          <HelpView key="help-view" onClose={() => navigate("/")} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Form Modals (Portal Layer) */}
        {isAddModalOpen && (
          <AddExpenseModal
            key="add-expense-modal"
            isOpen={isAddModalOpen}
            onClose={async () => {
              await Haptics.impact({ style: ImpactStyle.Light });
              navigate("/");
              setAddExpenseDate(undefined);
              setPrefillData(null);
            }}
            onAdd={(data) => {
              handleAddExpense(data);
              setPrefillData(null);
            }}
            isDarkMode={isDarkMode}
            initialDate={addExpenseDate}
            initialAmount={prefillData?.amount?.toString()}
            initialDescription={prefillData?.description}
            initialCategory={prefillData?.category}
          />
        )}

        {isEditModalOpen && editingExpense && (
          <EditExpenseModal
            key={`edit-expense-${editingExpense.id}`}
            isOpen={isEditModalOpen}
            onClose={async () => {
              await Haptics.impact({ style: ImpactStyle.Light });
              navigate("/");
            }}
            expense={editingExpense}
            onSave={handleSaveEdit}
            onDelete={handleDeleteExpense}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Global Recurring Expense Modal */}
        {isGlobalRecurringModalOpen && (
          <AddRecurringExpenseModal
            onClose={() => {
              setIsGlobalRecurringModalOpen(false);
              setSelectedRecurringExpense(undefined);
            }}
            onSave={async (data) => {
              try {
                if (selectedRecurringExpense?.id) {
                  await updateRecurringExpense(selectedRecurringExpense.id, data);
                  message.success("Recurring expense updated");
                } else {
                  await createRecurringExpense(data);
                  message.success("Recurring expense created");
                }
                setIsGlobalRecurringModalOpen(false);
                setSelectedRecurringExpense(undefined);
                // Trigger refresh via event
                window.dispatchEvent(new CustomEvent('recurringExpenseChanged'));
              } catch (err) {
                console.error("Failed to save recurring expense", err);
                message.error("Failed to save recurring expense");
              }
            }}
            isDarkMode={isDarkMode}
            expense={selectedRecurringExpense}
          />
        )}
      </AnimatePresence>

      <BudgetOverviewDetails
        isOpen={isBudgetOverviewExpanded}
        onClose={() => setIsBudgetOverviewExpanded(false)}
        isDarkMode={isDarkMode}
        onSetBudget={() => {
          setIsBudgetOverviewExpanded(false);
          navigate("/budget-settings");
        }}
        {...budgetOverviewData}
      />

      {!isAnyOverlayOpen && (
        <>
          <div 
            className="fixed bottom-0 left-0 right-0"
            style={{ 
              height: 'max(env(safe-area-inset-bottom, 0px), 34px)', 
              backgroundColor: isDarkMode ? "#000000" : '#ffffff',
              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
              zIndex: 10000
            }}
          />

          <div 
            className="fixed bottom-0 left-0 right-0"
            style={{ 
              backgroundColor: isDarkMode ? "#000000" : '#ffffff',
              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
              paddingBottom: 'env(safe-area-inset-bottom, 12px)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              minHeight: '80px',
              paddingLeft: '8px',
              paddingRight: '8px',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.2)',
              zIndex: 10001
            }}
          >
        <button onClick={() => setActiveTab("home")} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'home' ? '#007aff' : '#8e8e93', position: 'relative', transition: 'all 0.2s' }}>
          <Calendar className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Home</span>
          {activeTab === 'home' && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px', backgroundColor: '#007aff', borderRadius: '0 0 6px 6px' }} />}
        </button>

        <button onClick={() => setActiveTab("sms")} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'sms' ? '#007aff' : '#8e8e93', position: 'relative', transition: 'all 0.2s' }}>
          <div style={{ position: 'relative' }}>
            <Smartphone className="w-6 h-6" strokeWidth={activeTab === 'sms' ? 2.5 : 2} />
            {smsTransactions.filter(t => !t.isProcessed).length > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-12px', backgroundColor: '#ff3b30', color: 'white', borderRadius: '12px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: isDarkMode ? '2px solid #000000' : '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                {smsTransactions.filter(t => !t.isProcessed).length}
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Alerts</span>
          {activeTab === 'sms' && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px', backgroundColor: '#007aff', borderRadius: '0 0 6px 6px' }} />}
        </button>
        
        <button onClick={() => setActiveTab("stats")} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'stats' ? '#007aff' : '#8e8e93', position: 'relative', transition: 'all 0.2s' }}>
          <BarChart3 className="w-6 h-6" strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Stats</span>
          {activeTab === 'stats' && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px', backgroundColor: '#007aff', borderRadius: '0 0 6px 6px' }} />}
        </button>

        <button onClick={() => setActiveTab("bills")} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'bills' ? '#007aff' : '#8e8e93', position: 'relative', transition: 'all 0.2s' }}>
          <Repeat className="w-6 h-6" strokeWidth={activeTab === 'bills' ? 2.5 : 2} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Bills</span>
          {activeTab === 'bills' && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px', backgroundColor: '#007aff', borderRadius: '0 0 6px 6px' }} />}
        </button>
      </div>
      </>
      )}
    </>
  );
}
