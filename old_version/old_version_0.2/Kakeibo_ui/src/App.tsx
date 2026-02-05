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
} from "lucide-react";
import { useState } from "react";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { CalendarView } from "./components/CalendarView";
import { DailyExpensePopup } from "./components/DailyExpensePopup";
import { BudgetSettingsModal } from "./components/BudgetSettingsModal";
import { BudgetWarning } from "./components/BudgetWarning";
import { AnalyticsView } from "./components/AnalyticsView";
import { CategoryFilter } from "./components/CategoryFilter";
import { Expense, UIExpense } from "./types/expense";

// Mock data for today's expenses
const initialExpenses: UIExpense[] = [
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

export default function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDailyPopupOpen, setIsDailyPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  //const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<UIExpense[]>(
    [],
  );

  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<UIExpense[]>(initialExpenses);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get today's expenses
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date).toISOString().split("T")[0];
    return expDate === todayStr;
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

  const handleAddExpense = (newExpense: {
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const expense: UIExpense = {
      id: Date.now().toString(),
      description: newExpense.description,
      category: newExpense.category,
      amount: newExpense.amount,
      time,
      icon: getCategoryIcon(newExpense.category),
      color: getCategoryColor(newExpense.category),
      date: newExpense.date,
    };

    setExpenses([expense, ...expenses]);
  };

  const handleDateClick = (date: Date, dayExpenses: Expense[]) => {
    setSelectedDate(date);

    const enriched: UIExpense[] = dayExpenses.map((exp) => ({
      ...exp,
      time: "12:00 PM", // TODO: derive properly later
      icon: getCategoryIcon(exp.category),
      color: getCategoryColor(exp.category),
    }));

    setSelectedDayExpenses(enriched);
    setIsDailyPopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-lg mx-auto px-5 py-6 safe-area-inset">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight mb-2">
                Kakeibo
              </h1>
              <p className="text-[17px] text-black/50">
                Track today. Plan tomorrow.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-[#f5f5f7] transition-colors shadow-sm"
              >
                <BarChart3 className="w-5 h-5 text-black" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-[#f5f5f7] transition-colors shadow-sm"
              >
                <Settings className="w-5 h-5 text-black" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 shadow-lg">
            <p className="text-white/80 text-[13px] font-semibold mb-1 uppercase tracking-wider">
              {currentMonth}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-[48px] font-bold tracking-tighter">
                ${monthTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-[15px]">Total Spent This Month</p>
          </div>
        </header>

        {/* Budget Warning */}
        <BudgetWarning
          monthlyBudget={monthlyBudget}
          currentSpending={monthTotal}
          onSetBudget={() => setIsBudgetModalOpen(true)}
        />

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full bg-black hover:bg-black/90 text-white py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 mb-8 shadow-sm active:scale-[0.97] font-semibold text-[17px]"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          <span>Add Expense</span>
        </button>

        {/* Today's Expenses Section */}
        <section className="mb-5">
          <h2 className="text-[28px] font-bold text-black mb-4 tracking-tight">
            Today
          </h2>

          <div className="bg-white/80 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-sm border border-black/5">
            {todaysExpenses.length > 0 ? (
              todaysExpenses.map((expense, index) => {
                const Icon = expense.icon;
                return (
                  <div key={expense.id}>
                    <div className="p-4 flex items-center gap-3.5 active:bg-black/5 transition-colors cursor-pointer">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <Icon
                          className="w-5 h-5 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-semibold text-black mb-0.5">
                          {expense.description}
                        </p>
                        <p className="text-[15px] text-black/45">
                          {expense.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[20px] font-bold text-black tabular-nums">
                          ${expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {index < todaysExpenses.length - 1 && (
                      <div className="h-[0.5px] bg-black/8 ml-16"></div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center">
                <p className="text-[17px] text-black/40">No expenses today</p>
              </div>
            )}
          </div>
        </section>

        {/* View Calendar Button */}
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="w-full bg-white/80 backdrop-blur-xl hover:bg-white/90 text-[#007aff] py-[15px] px-6 rounded-[14px] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.97] font-semibold text-[17px] border border-black/5"
        >
          <Calendar className="w-5 h-5" strokeWidth={2.5} />
          <span>View Past Expenses</span>
        </button>

        {/* Kakeibo Philosophy Quote */}
        <div className="mt-10 px-4">
          <div className="border-t border-black/8 pt-6">
            <p className="text-[15px] text-center text-black/50 leading-relaxed">
              "Before you buy, ask yourself:
              <br />
              Will this bring me joy?"
            </p>
            <p className="text-[13px] text-center text-black/30 mt-2 font-medium">
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
      />

      {isCalendarOpen && (
        <CalendarView
          expenses={expenses.map(
            ({ id, category, amount, description, date }) => ({
              id,
              category,
              amount,
              description,
              date,
            }),
          )}
          onClose={() => setIsCalendarOpen(false)}
          onDateClick={handleDateClick}
        />
      )}

      <DailyExpensePopup
        isOpen={isDailyPopupOpen}
        onClose={() => setIsDailyPopupOpen(false)}
        date={selectedDate}
        expenses={selectedDayExpenses}
      />

      {isBudgetModalOpen && (
        <BudgetSettingsModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          currentBudget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
        />
      )}

      {isAnalyticsOpen && (
        <AnalyticsView
          expenses={expenses}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}
    </div>
  );
}
