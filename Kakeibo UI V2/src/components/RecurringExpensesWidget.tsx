import { motion } from 'motion/react';
import { Repeat, ChevronRight, AlertCircle } from 'lucide-react';
import { RecurringExpense } from './RecurringExpensesView';

interface RecurringExpensesWidgetProps {
  onOpenRecurring: () => void;
  isDarkMode: boolean;
}

export function RecurringExpensesWidget({ onOpenRecurring, isDarkMode }: RecurringExpensesWidgetProps) {
  const expenses: RecurringExpense[] = JSON.parse(
    localStorage.getItem('kakeibo_recurring_expenses') || '[]'
  );

  // Get active expenses only
  const activeExpenses = expenses.filter(exp => exp.isActive);

  // Check if any are due
  const isDue = (nextOccurrence: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextOccurrence);
    due.setHours(0, 0, 0, 0);
    return due <= today;
  };

  const dueExpenses = activeExpenses.filter(exp => isDue(exp.nextOccurrence));
  
  // Don't show widget if no active expenses
  if (activeExpenses.length === 0) return null;

  // Calculate monthly projection
  const monthlyProjection = activeExpenses.reduce((sum, exp) => {
    let monthlyAmount = 0;
    switch (exp.frequency) {
      case 'daily':
        monthlyAmount = exp.amount * 30;
        break;
      case 'weekly':
        monthlyAmount = exp.amount * 4;
        break;
      case 'monthly':
        monthlyAmount = exp.amount;
        break;
      case 'yearly':
        monthlyAmount = exp.amount / 12;
        break;
    }
    return sum + monthlyAmount;
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18 }}
      className="mb-5"
    >
      <button
        onClick={onOpenRecurring}
        className={`w-full p-4 rounded-[20px] border transition-all active:scale-[0.98] ${
          dueExpenses.length > 0
            ? (isDarkMode 
                ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15' 
                : 'bg-purple-50 border-purple-200 hover:bg-purple-100')
            : (isDarkMode
                ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                : 'bg-blue-50 border-blue-200 hover:bg-blue-100')
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {dueExpenses.length > 0 ? (
              <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} strokeWidth={2.5} />
            ) : (
              <Repeat className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2.5} />
            )}
            <h3 className={`text-[17px] font-semibold ${
              dueExpenses.length > 0
                ? (isDarkMode ? 'text-purple-400' : 'text-purple-700')
                : (isDarkMode ? 'text-blue-400' : 'text-blue-700')
            }`}>
              Recurring Expenses
            </h3>
          </div>
          <ChevronRight className={`w-5 h-5 ${
            dueExpenses.length > 0
              ? (isDarkMode ? 'text-purple-400' : 'text-purple-600')
              : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
          }`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={`text-[13px] mb-1 ${
              isDarkMode ? 'text-white/50' : 'text-black/50'
            }`}>
              Monthly Impact
            </p>
            <p className={`text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              ₹{monthlyProjection.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={`text-[13px] mb-1 ${
              isDarkMode ? 'text-white/50' : 'text-black/50'
            }`}>
              Active / Due Now
            </p>
            <p className={`text-[20px] font-bold ${
              dueExpenses.length > 0 
                ? (isDarkMode ? 'text-purple-400' : 'text-purple-700')
                : (isDarkMode ? 'text-white' : 'text-black')
            }`}>
              {activeExpenses.length} / {dueExpenses.length}
            </p>
          </div>
        </div>

        {dueExpenses.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${
            isDarkMode ? 'border-purple-500/20' : 'border-purple-300'
          }`}>
            <p className={`text-[13px] ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
              {dueExpenses.length} expense{dueExpenses.length !== 1 ? 's' : ''} ready to process
            </p>
          </div>
        )}
      </button>
    </motion.div>
  );
}
