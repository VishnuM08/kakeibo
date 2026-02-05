import {
  Plus,
  Calendar,
  Coffee,
  ShoppingBag,
  Train,
  Utensils,
  BarChart3,
  Settings,
  Film,
  Zap,
  MoreHorizontal,
  Moon,
  Sun,
  Repeat,
  Target,
  Download,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AddExpenseModal } from "./AddExpenseModal";
import { CalendarView } from "./CalendarView";
import { DailyExpensePopup } from "./DailyExpensePopup";
import { BudgetSettingsModal } from "./BudgetSettingsModal";
import { BudgetWarning } from "./BudgetWarning";
import { AnalyticsView } from "./AnalyticsView";
import { EditExpenseModal } from "./EditExpenseModal";
import { SearchFilters } from "./SearchFilters";
import { RecurringExpenseModal } from "./RecurringExpenseModal";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { exportToCSV, getCurrentMonthRange } from "../utils/exportUtils";
import { Expense as APIExpense } from "../services/api";
import {
  initializeSyncListeners,
  saveExpenseLocally,
  updateExpenseLocally,
  deleteExpenseLocally,
  getExpensesLocally,
  saveBudgetLocally,
  getBudgetLocally,
  getSyncStatus,
} from "../utils/syncUtils";

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

interface Expense extends APIExpense {
  icon: typeof Coffee;
  color: string;
  time: string;
}

// Mock data for today's expenses
const initialExpenses: Expense[] = [
  {
    id: "1",
    category: "food",
    amount: 12.5,
    description: "Lunch at cafe",
    time: "12:30 PM",
    icon: Utensils,
    color: "from-[#ff6b6b] to-[#ee5a6f]",
    date: new Date().toISOString(),
  },
  {
    id: "2",
    category: "transport",
    amount: 5.0,
    description: "Subway fare",
    time: "9:15 AM",
    icon: Train,
    color: "from-[#4ecdc4] to-[#44a08d]",
    date: new Date().toISOString(),
  },
  {
    id: "3",
    category: "coffee",
    amount: 4.8,
    description: "Morning coffee",
    time: "8:45 AM",
    icon: Coffee,
    color: "from-[#f7b731] to-[#fa8231]",
    date: new Date().toISOString(),
  },
];

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: typeof Coffee } = {
    food: Utensils,
    transport: Train,
    coffee: Coffee,
    shopping: ShoppingBag,
    entertainment: Film,
    utilities: Zap,
    other: MoreHorizontal,
  };
  return icons[category.toLowerCase()] || Coffee;
};

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    food: 'from-[#ff6b6b] to-[#ee5a6f]',
    transport: 'from-[#4ecdc4] to-[#44a08d]',
    coffee: 'from-[#f7b731] to-[#fa8231]',
    shopping: 'from-[#a29bfe] to-[#6c5ce7]',
    entertainment: 'from-[#fd79a8] to-[#e84393]',
    utilities: 'from-[#00b894] to-[#00cec9]',
    other: 'from-[#b2bec3] to-[#636e72]',
  };
  return colors[category.toLowerCase()] || 'from-[#b2bec3] to-[#636e72]';
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
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSavingsGoalsOpen, setIsSavingsGoalsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get today's expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date).toISOString().split('T')[0];
    return expDate === todayStr;
  });

  const todayTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Get current month total
  const currentMonthNum = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotal = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonthNum && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const handleAddExpense = (newExpense: {
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,
      time: time,
      icon: getCategoryIcon(newExpense.category),
      color: getCategoryColor(newExpense.category),
      date: newExpense.date,
    };

    setExpenses([expense, ...expenses]);
    saveExpenseLocally(expense);
  };

  const handleDateClick = (date: Date, dayExpenses: Expense[]) => {
    setSelectedDate(date);
    setSelectedDayExpenses(dayExpenses);
    setIsDailyPopupOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedExpense: Expense) => {
    const updatedExpenses = expenses.map(exp => {
      if (exp.id === updatedExpense.id) {
        return updatedExpense;
      }
      return exp;
    });
    setExpenses(updatedExpenses);
    updateExpenseLocally(updatedExpense);
    setIsEditModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    setExpenses(updatedExpenses);
    deleteExpenseLocally(expenseId);
  };

  const handleRecurringExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsRecurringModalOpen(true);
  };

  const handleSaveRecurring = (recurringExpense: Expense) => {
    const updatedExpenses = expenses.map(exp => {
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

  const filteredExpenses = expenses.filter(exp => {
    return exp.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportToCSV = () => {
    const [startDate, endDate] = getCurrentMonthRange();
    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= startDate && expDate <= endDate;
    });
    exportToCSV(filteredExpenses, 'expenses.csv');
  };

  useEffect(() => {
    // Initialize sync listeners
    initializeSyncListeners(() => {
      // Reload expenses when sync completes
      const syncedExpenses = getExpensesLocally();
      // Map expenses to include icon and color based on category
      const mappedExpenses = syncedExpenses.map(exp => ({
        ...exp,
        icon: getCategoryIcon(exp.category),
        color: getCategoryColor(exp.category),
        time: new Date(exp.date).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
      }));
      setExpenses(mappedExpenses);
    });

    // Load initial expenses from localStorage
    const storedExpenses = getExpensesLocally();
    if (storedExpenses.length > 0) {
      // Map expenses to include icon and color based on category
      const mappedExpenses = storedExpenses.map(exp => ({
        ...exp,
        icon: getCategoryIcon(exp.category),
        color: getCategoryColor(exp.category),
        time: new Date(exp.date).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
      }));
      setExpenses(mappedExpenses);
    } else {
      // Use initial mock data
      setExpenses(initialExpenses);
      // Save to localStorage
      initialExpenses.forEach(exp => saveExpenseLocally(exp));
    }

    // Load budget from localStorage
    const storedBudget = getBudgetLocally();
    if (storedBudget !== null) {
      setMonthlyBudget(storedBudget);
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#121212]' : 'bg-[#f5f5f7]'}`}>
      <div className="max-w-lg mx-auto px-5 py-6 safe-area-inset">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-[34px] font-bold tracking-tight leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Kakeibo
              </h1>
              <p className={`text-[17px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                Track today. Plan tomorrow.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleDarkMode && onToggleDarkMode()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode 
                    ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e]' 
                    : 'bg-white hover:bg-[#f5f5f7]'
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
                    ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e]' 
                    : 'bg-white hover:bg-[#f5f5f7]'
                }`}
              >
                <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => onOpenSettings && onOpenSettings()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  isDarkMode 
                    ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e]' 
                    : 'bg-white hover:bg-[#f5f5f7]'
                }`}
              >
                <Settings className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 shadow-lg">
            <p className="text-white/80 text-[13px] font-semibold mb-1 uppercase tracking-wider">
              {currentMonth}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-[48px] font-bold tracking-tighter">
                ₹{monthTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-[15px]">
              Total Spent This Month
            </p>
          </div>
        </header>

        {/* Budget Warning */}
        <BudgetWarning
          monthlyBudget={monthlyBudget}
          currentSpending={monthTotal}
          onSetBudget={() => setIsBudgetModalOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Add Expense Button */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 mb-5 shadow-sm active:scale-[0.97] font-semibold text-[17px] ${
            isDarkMode
              ? 'bg-white hover:bg-white/90 text-black'
              : 'bg-black hover:bg-black/90 text-white'
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
                ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10'
                : 'bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5'
            }`}
          >
            <Repeat className="w-4 h-4" strokeWidth={2.5} />
            <span>Recurring</span>
          </button>
          <button
            onClick={() => setIsSavingsGoalsOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10'
                : 'bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5'
            }`}
          >
            <Target className="w-4 h-4" strokeWidth={2.5} />
            <span>Savings</span>
          </button>
          <button
            onClick={handleExportToCSV}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10'
                : 'bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5'
            }`}
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`py-3 px-4 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] font-semibold text-[15px] border ${
              isDarkMode
                ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10'
                : 'bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5'
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
            <span>Search</span>
          </button>
        </div>

        {/* Today's Expenses Section */}
        <section className="mb-5">
          <h2 className={`text-[28px] font-bold mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Today
          </h2>

          <div className={`backdrop-blur-xl rounded-[20px] overflow-hidden shadow-sm border ${
            isDarkMode 
              ? 'bg-[#1c1c1e]/90 border-white/10' 
              : 'bg-white/80 border-black/5'
          }`}>
            {todaysExpenses.length > 0 ? (
              todaysExpenses.map((expense, index) => {
                const Icon = expense.icon;
                return (
                  <div key={expense.id}>
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className={`w-full p-4 flex items-center gap-3.5 transition-colors cursor-pointer text-left ${
                        isDarkMode ? 'active:bg-white/5 hover:bg-white/3' : 'active:bg-black/5 hover:bg-black/3'
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
                        <p className={`text-[17px] font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {expense.description}
                        </p>
                        <p className={`text-[15px] ${isDarkMode ? 'text-white/45' : 'text-black/45'}`}>
                          {expense.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[20px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          ₹{expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </button>
                    {index < todaysExpenses.length - 1 && (
                      <div className={`h-[0.5px] ml-16 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`}></div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center">
                <p className={`text-[17px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
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
              ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 text-[#0a84ff] border-white/10'
              : 'bg-white/80 hover:bg-white/90 text-[#007aff] border-black/5'
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={2.5} />
          <span>View Past Expenses</span>
        </button>

        {/* Kakeibo Philosophy Quote */}
        <div className="mt-10 px-4">
          <div className={`border-t pt-6 ${isDarkMode ? 'border-white/10' : 'border-black/8'}`}>
            <p className={`text-[15px] text-center leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
              "Before you buy, ask yourself:
              <br />
              Will this bring me joy?"
            </p>
            <p className={`text-[13px] text-center mt-2 font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
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
          currentBudget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
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
            console.log('Recurring expense created:', recurringData);
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
          console.log('Filters applied:', filters);
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
