import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Expense } from '../types/expense';

interface CalendarViewProps {
  expenses: Expense[];
  onClose: () => void;
  onDateClick: (date: Date, dayExpenses: Expense[]) => void;
}

export function CalendarView({ expenses, onClose, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getExpensesForDate = (day: number): Expense[] => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate === dateStr;
    });
  };

  const getTotalForDate = (day: number): number => {
    const dayExpenses = getExpensesForDate(day);
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
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
        className={`aspect-square rounded-[12px] p-2 flex flex-col items-center justify-center transition-all hover:bg-[#f5f5f7] active:scale-95 ${
          today ? 'bg-[#007aff] text-white hover:bg-[#0051d5]' : ''
        }`}
      >
        <span className={`text-[17px] font-semibold mb-0.5 ${today ? 'text-white' : 'text-black'}`}>
          {day}
        </span>
        {hasExpenses && (
          <span className={`text-[11px] font-medium ${today ? 'text-white/80' : 'text-[#007aff]'}`}>
            ${total.toFixed(0)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f5f5f7] z-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
          <h1 className="text-[28px] font-bold text-black flex-1">
            Past Expenses
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-[20px] p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={previousMonth}
              className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-black" strokeWidth={2.5} />
            </button>
            
            <h2 className="text-[20px] font-bold text-black">
              {monthName}
            </h2>
            
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-black" strokeWidth={2.5} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-[13px] font-semibold text-black/40 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm">
          <h3 className="text-[17px] font-bold text-black mb-3">
            Monthly Summary
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] font-bold text-black">
              ${expenses
                .filter(exp => {
                  const expDate = new Date(exp.date);
                  return expDate.getMonth() === month && expDate.getFullYear() === year;
                })
                .reduce((sum, exp) => sum + exp.amount, 0)
                .toFixed(2)}
            </span>
          </div>
          <p className="text-[15px] text-black/50 mt-1">
            Total spent in {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
}
