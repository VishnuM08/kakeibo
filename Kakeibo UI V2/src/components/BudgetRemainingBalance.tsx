import { Wallet, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Budget Remaining Balance Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 * ═══════════════════════════════════════════════════════════════════════════
 * Displays the remaining balance after expenses based on monthly budget.
 * Shows how much money is left to spend for the current month.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND INTEGRATION:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * API ENDPOINTS USED:
 * -------------------
 * 1. POST /api/budget
 *    - Store/update monthly budget
 *    - Request body: { amount: number, month: string, year: number }
 *    - Response: { id: string, amount: number, month: string, year: number }
 * 
 * 2. GET /api/budget/current
 *    - Get remaining balance for current month
 *    - Response: { 
 *        budget: number,           // Total budget set
 *        spent: number,            // Total spent so far
 *        remaining: number,        // Budget - Spent
 *        percentage: number,       // (Spent / Budget) * 100
 *        isOverBudget: boolean     // true if spent > budget
 *      }
 * 
 * DATA FLOW:
 * ----------
 * 1. Component mounts → Call GET /api/budget/current
 * 2. Display remaining balance from API response
 * 3. When expense is added → Backend automatically recalculates
 * 4. Poll API every 30 seconds OR use WebSocket for real-time updates
 * 
 * OFFLINE HANDLING:
 * -----------------
 * - Calculate remaining locally if API fails
 * - Show "(Offline)" indicator
 * - Sync when connection restored
 */

interface BudgetRemainingBalanceProps {
  monthlyBudget: number | null;
  currentSpending: number;
  onSetBudget: () => void;
  isDarkMode?: boolean;
}

export function BudgetRemainingBalance({
  monthlyBudget,
  currentSpending,
  onSetBudget,
  isDarkMode = false,
}: BudgetRemainingBalanceProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════
  
  // Calculate remaining balance locally
  const localRemaining = monthlyBudget ? monthlyBudget - currentSpending : null;
  
  // Calculate percentage spent
  const percentageSpent = monthlyBudget ? (currentSpending / monthlyBudget) * 100 : 0;
  
  // Check if over budget
  const isOverBudget = localRemaining !== null && localRemaining < 0;
  
  // Calculate days remaining in month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, lastDayOfMonth.getDate() - today.getDate());
  
  // Calculate daily budget allowance
  const dailyAllowance = localRemaining && daysRemaining > 0 
    ? localRemaining / daysRemaining 
    : 0;

  // ═══════════════════════════════════════════════════════════
  // BACKEND API INTEGRATION
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Fetch remaining balance from backend API
   * 
   * TODO: BACKEND INTEGRATION
   * Replace this mock function with actual API call
   */
  const fetchRemainingBalance = async () => {
    if (!monthlyBudget) return;
    
    setIsLoading(true);
    setIsOffline(false);
    
    try {
      // TODO: BACKEND - Call GET /api/budget/current
      // const response = await fetch(`${API_BASE_URL}/api/budget/current`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${getToken()}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to fetch budget');
      // }
      // 
      // const data = await response.json();
      // setRemainingBalance(data.remaining);
      
      // MOCK RESPONSE (for development)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use local calculation for now
      setRemainingBalance(localRemaining);
      
    } catch (error) {
      console.error('Failed to fetch remaining balance:', error);
      
      // Fallback to local calculation
      setRemainingBalance(localRemaining);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Fetch balance when budget or spending changes
   */
  useEffect(() => {
    fetchRemainingBalance();
  }, [monthlyBudget, currentSpending]);

  /**
   * Poll API every 30 seconds for real-time updates
   * 
   * TODO: BACKEND INTEGRATION
   * Alternative: Use WebSocket for real-time updates instead of polling
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRemainingBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [monthlyBudget]);

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get status color based on remaining balance
   */
  const getStatusColor = () => {
    if (isOverBudget) {
      return isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]'; // Red
    }
    
    if (percentageSpent >= 80) {
      return isDarkMode ? 'text-[#ffd60a]' : 'text-[#ffcc00]'; // Yellow
    }
    
    return isDarkMode ? 'text-[#30d158]' : 'text-[#34c759]'; // Green
  };

  /**
   * Get icon based on budget status
   */
  const getStatusIcon = () => {
    if (isOverBudget) {
      return <AlertCircle className="w-5 h-5" strokeWidth={2.5} />;
    }
    
    if (percentageSpent >= 80) {
      return <TrendingDown className="w-5 h-5" strokeWidth={2.5} />;
    }
    
    return <TrendingUp className="w-5 h-5" strokeWidth={2.5} />;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  // Don't show if no budget is set
  if (!monthlyBudget) {
    return (
      <button
        onClick={onSetBudget}
        className={`w-full rounded-[20px] p-5 shadow-sm mb-5 transition-all active:scale-[0.98] border ${
          isDarkMode
            ? 'bg-[#1c1c1e]/90 border-white/10 hover:bg-[#2c2c2e]/90'
            : 'bg-white/80 border-black/5 hover:bg-white/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-[#0a84ff]/20' : 'bg-[#007aff]/10'
            }`}>
              <Wallet className={`w-5 h-5 ${isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]'}`} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className={`text-[17px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Set Monthly Budget
              </p>
              <p className={`text-[15px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                Track your spending limit
              </p>
            </div>
          </div>
          <div className={`text-[13px] font-semibold px-3 py-1.5 rounded-full ${
            isDarkMode ? 'bg-[#0a84ff] text-white' : 'bg-[#007aff] text-white'
          }`}>
            Setup
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`rounded-[20px] p-5 shadow-sm mb-5 border ${
        isDarkMode
          ? 'bg-[#1c1c1e]/90 border-white/10'
          : 'bg-white/80 border-black/5'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} strokeWidth={2.5} />
          <h3 className={`text-[17px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Remaining Balance
          </h3>
          {isOffline && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-[#2c2c2e] text-white/50' : 'bg-[#f5f5f7] text-black/50'
            }`}>
              Offline
            </span>
          )}
        </div>
        <button
          onClick={onSetBudget}
          className={`text-[15px] font-semibold ${isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]'}`}
        >
          Edit
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="mb-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-[42px] font-bold tabular-nums ${getStatusColor()}`}>
              ₹{Math.abs(remainingBalance || localRemaining || 0).toFixed(2)}
            </span>
            {isOverBudget && (
              <span className={`text-[15px] font-semibold ${getStatusColor()}`}>
                over budget
              </span>
            )}
          </div>
        )}
        <p className={`text-[15px] mt-1 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
          {isOverBudget ? "You've exceeded your budget" : 'Available to spend this month'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 gap-3 p-3 rounded-[12px] ${
        isDarkMode ? 'bg-[#2c2c2e]/50' : 'bg-[#f5f5f7]/50'
      }`}>
        {/* Budget */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Budget
          </p>
          <p className={`text-[17px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ₹{monthlyBudget.toFixed(2)}
          </p>
        </div>

        {/* Spent */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Spent
          </p>
          <p className={`text-[17px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ₹{currentSpending.toFixed(2)}
          </p>
        </div>

        {/* Days Remaining */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Days Left
          </p>
          <p className={`text-[17px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {daysRemaining}
          </p>
        </div>

        {/* Daily Allowance */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Per Day
          </p>
          <p className={`text-[17px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ₹{Math.max(0, dailyAllowance).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className={`text-[13px] font-semibold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
            {Math.round(percentageSpent)}% used
          </p>
          <div className={`flex items-center gap-1.5 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-[13px] font-semibold">
              {isOverBudget ? 'Over Budget' : percentageSpent >= 80 ? 'Almost There' : 'On Track'}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className={`h-2 rounded-full overflow-hidden ${
          isDarkMode ? 'bg-[#2c2c2e]' : 'bg-[#f5f5f7]'
        }`}>
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOverBudget
                ? isDarkMode ? 'bg-[#ff453a]' : 'bg-[#ff3b30]'
                : percentageSpent >= 80
                  ? isDarkMode ? 'bg-[#ffd60a]' : 'bg-[#ffcc00]'
                  : isDarkMode ? 'bg-[#30d158]' : 'bg-[#34c759]'
            }`}
            style={{ width: `${Math.min(100, percentageSpent)}%` }}
          />
        </div>
      </div>

      {/* Helpful Tip */}
      {!isOverBudget && daysRemaining > 0 && (
        <div className={`mt-4 p-3 rounded-[12px] border ${
          isDarkMode 
            ? 'bg-[#0a84ff]/10 border-[#0a84ff]/20' 
            : 'bg-[#007aff]/5 border-[#007aff]/10'
        }`}>
          <p className={`text-[13px] leading-relaxed ${
            isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]'
          }`}>
            💡 You can spend <strong>₹{dailyAllowance.toFixed(2)}</strong> per day for the next {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} to stay on budget.
          </p>
        </div>
      )}

      {/* Over Budget Warning */}
      {isOverBudget && (
        <div className={`mt-4 p-3 rounded-[12px] border ${
          isDarkMode 
            ? 'bg-[#ff453a]/10 border-[#ff453a]/20' 
            : 'bg-[#ff3b30]/5 border-[#ff3b30]/10'
        }`}>
          <p className={`text-[13px] leading-relaxed ${
            isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]'
          }`}>
            ⚠️ You've exceeded your monthly budget by <strong>₹{Math.abs(localRemaining || 0).toFixed(2)}</strong>. Consider reviewing your expenses or adjusting your budget.
          </p>
        </div>
      )}
    </div>
  );
}
