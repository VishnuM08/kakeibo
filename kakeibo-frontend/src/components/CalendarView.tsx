import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { UIExpense } from "../types/UIExpense";

interface CalendarViewProps {
  expenses: UIExpense[];
  onClose: () => void;
  onDateClick: (date: Date, dayExpenses: UIExpense[]) => void;
  isDarkMode?: boolean;
  inline?: boolean;
}

export function CalendarView({
  expenses,
  onClose,
  onDateClick,
  isDarkMode,
  inline = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // const getExpensesForDate = (day: number): UIExpense[] => {
  //   const date = new Date(year, month, day);
  //   const dateStr = date.toISOString().split("T")[0];

  //   return expenses.filter((expense) => {
  //     const expenseDate = new Date(expense.date).toISOString().split("T")[0];
  //     return expenseDate === dateStr;
  //   });
  // };

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  const getExpensesForDate = (day: number): UIExpense[] => {
    const targetDate = formatDate(new Date(year, month, day));

    return expenses.filter((expense) => {
      if (!expense.date) return false;

      const expenseDate = new Date(expense.date);
      if (isNaN(expenseDate.getTime())) return false;

      return formatDate(expenseDate) === targetDate;
    });
  };

  const getTotalForDate = (day: number): number => {
    const dayExpenses = getExpensesForDate(day);
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const dayExpenses = getExpensesForDate(day);
    onDateClick(date, dayExpenses);
  };

  // Generate calendar days
  const calendarDays = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const total = getTotalForDate(day);
    const hasExpenses = total > 0;
    const today = isToday(day);

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`${inline ? "h-9 rounded-[6px] p-0.5" : "aspect-square rounded-[12px] p-2"} flex flex-col items-center justify-center transition-all active:scale-95 ${
          today
            ? isDarkMode
              ? "bg-[#0a84ff] text-white hover:bg-[#0070e0]"
              : "bg-[#007aff] text-white hover:bg-[#0051D5]"
            : isDarkMode
              ? "hover:bg-[#2c2c2e]"
              : "hover:bg-[#f5f5f7]"
        }`}
      >
        <span
          className={`${inline ? "text-[13px]" : "text-[17px]"} font-semibold mb-0.5 ${
            today ? "text-white" : isDarkMode ? "text-white" : "text-black"
          }`}
        >
          {day}
        </span>
        {hasExpenses && (
          <span
            className={`${inline ? "text-[9px]" : "text-[11px]"} font-medium ${
              today
                ? "text-white/80"
                : isDarkMode
                  ? "text-[#0a84ff]"
                  : "text-[#007aff]"
            }`}
          >
            ₹{total.toFixed(0)}
          </span>
        )}
      </button>,
    );
  }

  return (
    <div
      className={
        inline
          ? "w-full h-full p-4"
          : `fixed inset-0 z-[100000] overflow-y-auto ${isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"} px-5`
      }
      style={!inline ? { 
        paddingTop: 'min(env(safe-area-inset-top, 24px), 40px)', 
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' 
      } : {}}
    >
      <div
        className={inline ? "w-full h-full flex flex-col" : "max-w-lg mx-auto"}
      >
        {/* Header */}
        {!inline ? (
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                  : "bg-white hover:bg-[#e5e5e7]"
              }`}
            >
              <ArrowLeft
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </button>
            <h1
              className={`text-[28px] font-bold flex-1 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Past Expenses
            </h1>
          </div>
        ) : (
          <h2
            className={`${inline ? "text-[17px] mb-3" : "text-[22px] mb-5"} font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Past Expenses
          </h2>
        )}

        {/* Month Navigation */}
        <div
          className={`rounded-[16px] p-4 mb-4 shadow-sm ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? "bg-[#2c2c2e] hover:bg-[#3c3c3e]"
                  : "bg-[#f5f5f7] hover:bg-[#e5e5e7]"
              }`}
            >
              <ChevronLeft
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </button>

            <h2
              className={`text-[20px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
            >
              {monthName}
            </h2>

            <button
              onClick={nextMonth}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? "bg-[#2c2c2e] hover:bg-[#3c3c3e]"
                  : "bg-[#f5f5f7] hover:bg-[#e5e5e7]"
              }`}
            >
              <ChevronRight
                className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
                strokeWidth={2.5}
              />
            </button>
          </div>

          {/* Weekday Headers */}
          <div
            className={`grid grid-cols-7 ${inline ? "gap-1 mb-1" : "gap-2 mb-2"}`}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className={`text-center ${inline ? "text-[11px] py-1" : "text-[13px] py-2"} font-semibold ${isDarkMode ? "text-white/40" : "text-black/40"}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={`grid grid-cols-7 ${inline ? "gap-1" : "gap-2"}`}>
            {calendarDays}
          </div>
        </div>

        {/* Summary */}
        <div
          className={`rounded-[20px] p-5 shadow-sm mt-auto ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <h3
            className={`text-[17px] font-bold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Monthly Summary
          </h3>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-[34px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
            >
              ₹
              {expenses
                .filter((exp) => {
                  if (!exp.date) return false;
                  const expDate = new Date(exp.date);
                  if (isNaN(expDate.getTime())) return false;

                  return (
                    expDate.getMonth() === month &&
                    expDate.getFullYear() === year
                  );
                })

                .reduce((sum, exp) => sum + exp.amount, 0)
                .toFixed(2)}
            </span>
          </div>
          <p
            className={`text-[15px] mt-1 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
          >
            Total spent in{" "}
            {currentDate.toLocaleDateString("en-US", { month: "long" })}
          </p>
        </div>
      </div>
    </div>
  );
}
