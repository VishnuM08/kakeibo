import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit2, 
  Play, 
  Pause,
  Coffee,
  Utensils,
  Train,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from '../utils/toast';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextOccurrence: string;
  isActive: boolean;
  notes?: string;
  lastProcessed?: string;
}

interface RecurringExpensesViewProps {
  onClose: () => void;
  isDarkMode: boolean;
  onAddExpense?: (expense: any) => void;
}

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: any } = {
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

export function RecurringExpensesView({ onClose, isDarkMode, onAddExpense }: RecurringExpensesViewProps) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  // Load recurring expenses from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kakeibo_recurring_expenses');
    if (stored) {
      setRecurringExpenses(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage
  const saveRecurringExpenses = (expenses: RecurringExpense[]) => {
    setRecurringExpenses(expenses);
    localStorage.setItem('kakeibo_recurring_expenses', JSON.stringify(expenses));
  };

  // Calculate next occurrence based on frequency
  const calculateNextOccurrence = (startDate: string, frequency: string, lastProcessed?: string): string => {
    const baseDate = lastProcessed ? new Date(lastProcessed) : new Date(startDate);
    const next = new Date(baseDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next.toISOString();
  };

  // Toggle active/pause
  const handleToggleActive = (id: string) => {
    const updated = recurringExpenses.map(exp => 
      exp.id === id ? { ...exp, isActive: !exp.isActive } : exp
    );
    saveRecurringExpenses(updated);
    toast.success(updated.find(e => e.id === id)?.isActive ? 'Recurring expense activated' : 'Recurring expense paused');
  };

  // Delete recurring expense
  const handleDelete = (id: string) => {
    const updated = recurringExpenses.filter(exp => exp.id !== id);
    saveRecurringExpenses(updated);
    toast.success('Recurring expense deleted');
  };

  // Process due expenses (add to regular expenses)
  const handleProcessNow = (expense: RecurringExpense) => {
    if (onAddExpense) {
      onAddExpense({
        description: expense.name,
        category: expense.category,
        amount: expense.amount,
        date: new Date().toISOString(),
      });

      // Update next occurrence
      const updated = recurringExpenses.map(exp => {
        if (exp.id === expense.id) {
          return {
            ...exp,
            lastProcessed: new Date().toISOString(),
            nextOccurrence: calculateNextOccurrence(exp.startDate, exp.frequency, new Date().toISOString()),
          };
        }
        return exp;
      });
      saveRecurringExpenses(updated);
      toast.success('Expense added successfully!');
    }
  };

  // Check if expense is due
  const isDue = (nextOccurrence: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextOccurrence);
    due.setHours(0, 0, 0, 0);
    return due <= today;
  };

  // Get days until next occurrence
  const getDaysUntil = (nextOccurrence: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextOccurrence);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Separate into active and paused
  const activeExpenses = recurringExpenses.filter(exp => exp.isActive);
  const pausedExpenses = recurringExpenses.filter(exp => !exp.isActive);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b ${
          isDarkMode ? 'bg-[#1c1c1e]/95 border-white/10' : 'bg-white/95 border-black/5'
        }`}>
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className={`text-[28px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Recurring Expenses
              </h2>
              <p className={`text-[15px] mt-1 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                Automate your regular expenses
              </p>
            </div>
            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
          </div>

          {/* Summary Card */}
          <div className="px-5 pb-4">
            <div className={`p-4 rounded-[14px] bg-gradient-to-br ${
              isDarkMode ? 'from-blue-500/20 to-purple-500/20' : 'from-blue-50 to-purple-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[13px] font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Monthly Projection
                </p>
                <TrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <p className={`text-[32px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                ₹{monthlyProjection.toFixed(2)}
              </p>
              <p className={`text-[13px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                {activeExpenses.length} active expense{activeExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <div className="p-5 space-y-6">
            {/* Active Expenses */}
            {activeExpenses.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  Active ({activeExpenses.length})
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {activeExpenses.map((expense) => (
                      <RecurringExpenseItem
                        key={expense.id}
                        expense={expense}
                        isDarkMode={isDarkMode}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                        onEdit={setEditingExpense}
                        onProcessNow={handleProcessNow}
                        isDue={isDue(expense.nextOccurrence)}
                        daysUntil={getDaysUntil(expense.nextOccurrence)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Paused Expenses */}
            {pausedExpenses.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  Paused ({pausedExpenses.length})
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pausedExpenses.map((expense) => (
                      <RecurringExpenseItem
                        key={expense.id}
                        expense={expense}
                        isDarkMode={isDarkMode}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                        onEdit={setEditingExpense}
                        onProcessNow={handleProcessNow}
                        isDue={false}
                        daysUntil={0}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Empty State */}
            {recurringExpenses.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Clock className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
                <p className={`text-[17px] font-medium mb-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                  No recurring expenses yet
                </p>
                <p className={`text-[15px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  Set up automatic tracking for regular expenses
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Add Button */}
        <div className={`sticky bottom-0 p-5 border-t backdrop-blur-xl ${
          isDarkMode ? 'bg-[#1c1c1e]/95 border-white/10' : 'bg-white/95 border-black/5'
        }`}>
          <button
            onClick={() => setIsAddingExpense(true)}
            className={`w-full py-4 px-6 rounded-[14px] font-semibold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              isDarkMode
                ? 'bg-[#0a84ff] hover:bg-[#0077ed] text-white'
                : 'bg-[#007aff] hover:bg-[#0051d5] text-white'
            }`}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span>Add Recurring Expense</span>
          </button>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {(isAddingExpense || editingExpense) && (
        <AddRecurringExpenseModal
          expense={editingExpense}
          onClose={() => {
            setIsAddingExpense(false);
            setEditingExpense(null);
          }}
          onSave={(expense) => {
            if (editingExpense) {
              // Edit existing
              const updated = recurringExpenses.map(exp => 
                exp.id === expense.id ? expense : exp
              );
              saveRecurringExpenses(updated);
              toast.success('Recurring expense updated!');
            } else {
              // Add new
              saveRecurringExpenses([...recurringExpenses, expense]);
              toast.success('Recurring expense added!');
            }
            setIsAddingExpense(false);
            setEditingExpense(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </motion.div>
  );
}

// Recurring Expense Item Component
interface RecurringExpenseItemProps {
  expense: RecurringExpense;
  isDarkMode: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: RecurringExpense) => void;
  onProcessNow: (expense: RecurringExpense) => void;
  isDue: boolean;
  daysUntil: number;
}

function RecurringExpenseItem({
  expense,
  isDarkMode,
  onToggleActive,
  onDelete,
  onEdit,
  onProcessNow,
  isDue,
  daysUntil,
}: RecurringExpenseItemProps) {
  const Icon = getCategoryIcon(expense.category);
  const color = getCategoryColor(expense.category);

  const getNextText = () => {
    if (!expense.isActive) return 'Paused';
    if (isDue) return 'Due now';
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    return `Due in ${daysUntil} days`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 rounded-[16px] border ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/3 border-black/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ${
          !expense.isActive ? 'opacity-50' : ''
        }`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-[17px] font-semibold ${
              isDarkMode ? 'text-white' : 'text-black'
            } ${!expense.isActive ? 'opacity-50' : ''}`}>
              {expense.name}
            </h4>
            <p className={`text-[17px] font-bold tabular-nums flex-shrink-0 ${
              isDarkMode ? 'text-white' : 'text-black'
            } ${!expense.isActive ? 'opacity-50' : ''}`}>
              ₹{expense.amount.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <p className={`text-[15px] capitalize ${
              isDue && expense.isActive
                ? (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                : (isDarkMode ? 'text-white/50' : 'text-black/50')
            }`}>
              {expense.frequency}
            </p>
            <span className={`text-[13px] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>•</span>
            <p className={`text-[15px] ${
              isDue && expense.isActive
                ? (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                : (isDarkMode ? 'text-white/50' : 'text-black/50')
            }`}>
              {getNextText()}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {expense.isActive && isDue && (
              <button
                onClick={() => onProcessNow(expense)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                Process Now
              </button>
            )}
            <button
              onClick={() => onToggleActive(expense.id)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1 ${
                expense.isActive
                  ? (isDarkMode
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200')
                  : (isDarkMode
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200')
              }`}
            >
              {expense.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {expense.isActive ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => onEdit(expense)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <Edit2 className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <Trash2 className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Add/Edit Modal Component
interface AddRecurringExpenseModalProps {
  expense: RecurringExpense | null;
  onClose: () => void;
  onSave: (expense: RecurringExpense) => void;
  isDarkMode: boolean;
}

function AddRecurringExpenseModal({ expense, onClose, onSave, isDarkMode }: AddRecurringExpenseModalProps) {
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [category, setCategory] = useState(expense?.category || 'utilities');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    expense?.frequency || 'monthly'
  );
  const [startDate, setStartDate] = useState(
    expense?.startDate ? new Date(expense.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(expense?.notes || '');

  const calculateNextOccurrence = (start: string, freq: string): string => {
    const next = new Date(start);
    const today = new Date();
    
    // If start date is in the past, calculate next occurrence from today
    if (next < today) {
      next.setTime(today.getTime());
    }

    switch (freq) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newExpense: RecurringExpense = {
      id: expense?.id || Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      frequency,
      startDate: new Date(startDate).toISOString(),
      nextOccurrence: expense?.nextOccurrence || calculateNextOccurrence(startDate, frequency),
      isActive: expense?.isActive ?? true,
      notes: notes.trim() || undefined,
      lastProcessed: expense?.lastProcessed,
    };

    onSave(newExpense);
  };

  const categories = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'coffee', label: 'Coffee & Snacks' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
        }`}
      >
        <form onSubmit={handleSubmit}>
          <div className={`p-5 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
            <h3 className={`text-[22px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {expense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
            </h3>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Name */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Expense Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Netflix Subscription"
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30'
                    : 'bg-black/5 border-black/10 text-black placeholder-black/30'
                }`}
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30'
                    : 'bg-black/5 border-black/10 text-black placeholder-black/30'
                }`}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border appearance-none ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] border-white/10 text-white [color-scheme:dark]'
                    : 'bg-white border-black/10 text-black [color-scheme:light]'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='${isDarkMode ? '%23ffffff' : '%23000000'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px',
                  paddingRight: '2.5rem',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border appearance-none ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] border-white/10 text-white [color-scheme:dark]'
                    : 'bg-white border-black/10 text-black [color-scheme:light]'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='${isDarkMode ? '%23ffffff' : '%23000000'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-black/5 border-black/10 text-black'
                }`}
              />
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border resize-none ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30'
                    : 'bg-black/5 border-black/10 text-black placeholder-black/30'
                }`}
              />
            </div>
          </div>

          <div className={`p-5 border-t flex gap-3 ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-[12px] font-semibold text-[17px] transition-colors ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-black/5 hover:bg-black/10 text-black'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-[12px] font-semibold text-[17px] transition-colors ${
                isDarkMode
                  ? 'bg-[#0a84ff] hover:bg-[#0077ed] text-white'
                  : 'bg-[#007aff] hover:bg-[#0051d5] text-white'
              }`}
            >
              {expense ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}