import { Coffee, Utensils, Train, ShoppingBag, Plus, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Quick Add Expenses Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 * ═══════════════════════════════════════════════════════════════════════════
 * Shows frequently used expenses for one-tap adding:
 * - Learns from user's expense history
 * - Shows 4 most common expense types
 * - Quick edit amount before adding
 * - Saves time for recurring daily expenses
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND INTEGRATION:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * API ENDPOINTS:
 * - GET /api/expenses/frequent - Get user's most frequent expenses
 * - POST /api/expenses/quick - Quick add with predefined template
 * 
 * Response format:
 * {
 *   "frequentExpenses": [
 *     {
 *       "category": "coffee",
 *       "description": "Morning Coffee",
 *       "averageAmount": 4.50,
 *       "frequency": 25
 *     }
 *   ]
 * }
 */

interface QuickExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  icon: typeof Coffee;
  color: string;
}

interface QuickAddExpensesProps {
  onQuickAdd: (expense: { description: string; category: string; amount: number; date: string }) => void;
  isDarkMode?: boolean;
}

const defaultQuickExpenses: QuickExpense[] = [
  {
    id: 'quick-1',
    category: 'coffee',
    description: 'Coffee',
    amount: 4.50,
    icon: Coffee,
    color: 'from-[#f7b731] to-[#fa8231]',
  },
  {
    id: 'quick-2',
    category: 'food',
    description: 'Lunch',
    amount: 12.00,
    icon: Utensils,
    color: 'from-[#ff6b6b] to-[#ee5a6f]',
  },
  {
    id: 'quick-3',
    category: 'transport',
    description: 'Transport',
    amount: 5.00,
    icon: Train,
    color: 'from-[#4ecdc4] to-[#44a08d]',
  },
  {
    id: 'quick-4',
    category: 'other',
    description: 'Snacks',
    amount: 3.00,
    icon: ShoppingBag,
    color: 'from-[#a29bfe] to-[#6c5ce7]',
  },
];

export function QuickAddExpenses({ onQuickAdd, isDarkMode = false }: QuickAddExpensesProps) {
  const [quickExpenses, setQuickExpenses] = useState<QuickExpense[]>(defaultQuickExpenses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // BACKEND API INTEGRATION
  // ═══════════════════════════════════════════════════════════
  
  const fetchFrequentExpenses = async () => {
    setIsLoading(true);
    
    try {
      // TODO: BACKEND - Call GET /api/expenses/frequent
      // const response = await fetch('/api/expenses/frequent', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setQuickExpenses(mapToQuickExpenses(data.frequentExpenses));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      // Use defaults for now
    } catch (error) {
      console.error('Failed to fetch frequent expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFrequentExpenses();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  const handleQuickAdd = (expense: QuickExpense, customAmount?: number) => {
    const finalAmount = customAmount || expense.amount;
    
    onQuickAdd({
      description: expense.description,
      category: expense.category,
      amount: finalAmount,
      date: new Date().toISOString(),
    });

    // TODO: BACKEND - Track usage for frequency learning
    // trackQuickExpenseUsage(expense.id);
  };

  const handleLongPress = (expense: QuickExpense) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount.toString());
  };

  const handleAmountSubmit = (expense: QuickExpense) => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount > 0) {
      handleQuickAdd(expense, amount);
    }
    setEditingId(null);
    setEditAmount('');
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-[17px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Quick Add
        </h3>
        <Zap className={`w-4 h-4 ${isDarkMode ? 'text-[#ffd60a]' : 'text-[#ffcc00]'}`} strokeWidth={2.5} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickExpenses.map((expense) => {
          const Icon = expense.icon;
          const isEditing = editingId === expense.id;

          return (
            <div key={expense.id}>
              {isEditing ? (
                <div className={`relative rounded-[16px] p-3 border ${
                  isDarkMode 
                    ? 'bg-[#1c1c1e]/90 border-white/10' 
                    : 'bg-white/80 border-black/5'
                }`}>
                  <div className="text-center mb-2">
                    <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onBlur={() => handleAmountSubmit(expense)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAmountSubmit(expense);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditAmount('');
                      }
                    }}
                    autoFocus
                    className={`w-full px-2 py-1.5 rounded-lg text-center text-[13px] font-semibold border ${
                      isDarkMode
                        ? 'bg-[#2c2c2e] border-white/10 text-white'
                        : 'bg-white border-black/10 text-black'
                    }`}
                    placeholder="₹0.00"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleQuickAdd(expense)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(expense);
                  }}
                  onTouchStart={(e) => {
                    const timer = setTimeout(() => {
                      handleLongPress(expense);
                    }, 500);
                    
                    const handleTouchEnd = () => {
                      clearTimeout(timer);
                      document.removeEventListener('touchend', handleTouchEnd);
                      document.removeEventListener('touchmove', handleTouchEnd);
                    };
                    
                    document.addEventListener('touchend', handleTouchEnd);
                    document.addEventListener('touchmove', handleTouchEnd);
                  }}
                  className={`w-full rounded-[16px] p-3 shadow-sm transition-all active:scale-95 border ${
                    isDarkMode 
                      ? 'bg-[#1c1c1e]/90 hover:bg-[#2c2c2e]/90 border-white/10' 
                      : 'bg-white/80 hover:bg-white/90 border-black/5'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${expense.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <p className={`text-[11px] font-semibold mb-0.5 truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {expense.description}
                    </p>
                    <p className={`text-[13px] font-bold tabular-nums ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                      ₹{expense.amount.toFixed(0)}
                    </p>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className={`text-[11px] text-center mt-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
        Tap to add • Long press to edit amount
      </p>
    </div>
  );
}
