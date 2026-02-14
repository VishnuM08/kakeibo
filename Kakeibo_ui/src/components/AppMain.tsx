import {
  BarChart3,
  Calendar,
  Download,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { exportToCSV, getCurrentMonthRange } from "../utils/exportUtils";
import { AddExpenseModal } from "./AddExpenseModal";
import { AnalyticsView } from "./AnalyticsView";
import { BudgetSettingsModal } from "./BudgetSettingsModal";
import { BudgetWarning } from "./BudgetWarning";
import { CalendarView } from "./CalendarView";
import { DailyExpensePopup } from "./DailyExpensePopup";
import { EditExpenseModal } from "./EditExpenseModal";
import { RecurringExpenseModal } from "./RecurringExpenseModal";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { SearchFilters } from "./SearchFilters";

import {
  createExpense,
  deleteExpense,
  getCurrentBudget,
  getExpenses,
  setMonthlyBudget,
  updateExpense,
} from "../services/api";
import { Budget } from "../types/Budget";
import { UIExpense } from "../types/UIExpense";
import {
  getCategoryColor,
  getCategoryIcon,
  mapApiExpenseToUI,
  mapUIToBackendExpense,
} from "../utils/expenseUIUtils";

export function AppMain({
  isDarkMode = false,
  onToggleDarkMode,
  onOpenSettings,
}: {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSettings?: () => void;
}) {
  //const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  //const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [editingExpense, setEditingExpense] = useState<UIExpense | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<UIExpense[]>(
    [],
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  //const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  //const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  //const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  //const [editingExpense, setEditingExpense] = useState<UIExpense | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSavingsGoalsOpen, setIsSavingsGoalsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);

  const handleSetBudget = async (amount: number) => {
    try {
      const updated = await setMonthlyBudget(amount);
      setBudget(updated); // 🔥 refresh UI instantly
      setIsBudgetModalOpen(false);
    } catch (e) {
      console.error("Failed to set budget", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const current = await getCurrentBudget();
        setBudget(current);
      } catch (e) {
        console.error("Failed to load budget", e);
      } finally {
        setBudgetLoading(false);
      }
    })();
  }, []);

  const refreshBudget = async () => {
    const updated = await getCurrentBudget();
    setBudget(updated);
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
      syncStatus: "pending",
    };

    console.log("🟡 Optimistic UI expense:", optimisticExpense);

    setExpenses((prev) => [optimisticExpense, ...prev]);

    try {
      const saved = await createExpense({
        description: newExpense.description,
        category: newExpense.category,
        amount: newExpense.amount,
        expenseDateTime: newExpense.expenseDateTime,
      });
      await refreshBudget();
      console.log("🟢 Backend saved:", saved);

      const savedUI = mapApiExpenseToUI(saved);

      setExpenses((prev) => prev.map((e) => (e.id === tempId ? savedUI : e)));
    } catch (err) {
      console.error("🔴 Create expense failed:", err);

      setExpenses((prev) =>
        prev.map((e) => (e.id === tempId ? { ...e, syncStatus: "failed" } : e)),
      );
    }
  };

  
  const handleSaveBudget = async (amount: number) => {
    try {
      const saved = await setMonthlyBudget(amount);
      setBudget(saved); // 🔥 refresh UI immediately
    } catch (e) {
      console.error("Failed to save budget", e);
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

  const handleSaveEdit = async (updatedUI: UIExpense) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === updatedUI.id ? { ...updatedUI, syncStatus: "pending" } : e,
      ),
    );

    try {
      const backendExpense = mapUIToBackendExpense(updatedUI);
      const saved = await updateExpense(updatedUI.id, backendExpense);
      await refreshBudget();
      const savedUI = mapApiExpenseToUI(saved);

      setExpenses((prev) =>
        prev.map((e) => (e.id === savedUI.id ? savedUI : e)),
      );
    } catch {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === updatedUI.id ? { ...e, syncStatus: "failed" } : e,
        ),
      );
    }

    setIsEditModalOpen(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const snapshot = expenses;

    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

    try {
      await deleteExpense(expenseId);
      await refreshBudget();
    } catch {
      // rollback if backend fails
      setExpenses(snapshot);
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
    async function load() {
      const apiExpenses = await getExpenses();
      const uiExpenses = apiExpenses.map(mapApiExpenseToUI);
      setExpenses(uiExpenses);
    }

    load();
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"}`}
    >
      <div className="max-w-lg mx-auto px-5 py-6 safe-area-inset">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between mb-6">
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
          </div>
          {budgetLoading ? (
            <div className="text-sm text-gray-500">Loading budget...</div>
          ) : budget ? (
            <div className="mb-4 rounded-xl p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="text-sm opacity-80">Monthly Budget</div>
              <div className="text-2xl font-bold">₹{budget.monthlyAmount}</div>

              <div className="mt-2 text-sm opacity-80">Remaining</div>
              <div
                className={`text-xl font-semibold ${
                  budget.remainingAmount < 0 ? "text-red-300" : ""
                }`}
              >
                ₹{budget.remainingAmount}
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-xl p-4 border border-dashed">
              <p className="text-sm text-gray-500">
                No budget set for this month
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 shadow-lg">
            <p className="text-white/80 text-[13px] font-semibold mb-1 uppercase tracking-wider">
              {currentMonth}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-[48px] font-bold tracking-tighter">
                ₹{monthTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-[15px]">Total Spent This Month</p>
          </div>
        </header>

        {/* Budget Warning */}
        <BudgetWarning
          budget={budget}
          onSetBudget={() => setIsBudgetModalOpen(true)}
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
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setIsRecurringModalOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Repeat className="w-4 h-4" strokeWidth={2.5} />
            <span>Recurring</span>
          </button>
          <button
            onClick={() => setIsSavingsGoalsOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Target className="w-4 h-4" strokeWidth={2.5} />
            <span>Savings</span>
          </button>
          <button
            onClick={handleExportToCSV}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10"
                : "bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5"
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
            <span>Search</span>
          </button>
        </div>

        {/* Today's Expenses Section */}
        <section className="mb-5">
          <h2
            className={`text-[28px] font-bold mb-4 tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Today
          </h2>

          <div
            className={`backdrop-blur-xl rounded-[20px] overflow-hidden shadow-sm border ${
              isDarkMode
                ? "bg-[#1c1c1e]/90 border-white/10"
                : "bg-white/80 border-black/5"
            }`}
          >
            {todaysExpenses.length > 0 ? (
              todaysExpenses.map((expense, index) => {
                const Icon = expense.icon;
                return (
                  <div key={expense.id}>
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className={`w-full p-4 flex items-center gap-3.5 transition-colors cursor-pointer text-left ${
                        isDarkMode
                          ? "active:bg-white/5 hover:bg-white/3"
                          : "active:bg-black/5 hover:bg-black/3"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <Icon
                          className="w-5 h-5 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
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
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center">
                <p
                  className={`text-[17px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                >
                  No expenses today
                </p>
              </div>
            )}
          </div>
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
      </div>

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
          currentBudget={budget?.monthlyAmount ?? null}
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
        <RecurringExpenseModal
          isOpen={isRecurringModalOpen}
          onClose={() => setIsRecurringModalOpen(false)}
          onSave={(recurringData) => {
            // TODO: BACKEND INTEGRATION - Save to API
            // createRecurringExpense(recurringData);
            console.log("Recurring expense created:", recurringData);
            setIsRecurringModalOpen(false);
          }}
          isDarkMode={isDarkMode}
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
    </div>
  );
}
