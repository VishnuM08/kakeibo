import { TrendingUp, TrendingDown, DollarSign, Calendar, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Weekly Summary Card Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 * ═══════════════════════════════════════════════════════════════════════════
 * Displays insights about the current week's spending:
 * - Total spent this week
 * - Comparison with weekly average
 * - Biggest expense of the week
 * - Days on/over budget
 * - Spending trend indicator
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKEND INTEGRATION:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * API ENDPOINTS:
 * - GET /api/expenses/weekly-summary - Get current week analytics
 * 
 * Response format:
 * {
 *   "weekTotal": 450.00,
 *   "weeklyAverage": 380.00,
 *   "biggestExpense": {
 *     "description": "Grocery Shopping",
 *     "amount": 85.00,
 *     "date": "2024-02-07"
 *   },
 *   "daysOnBudget": 5,
 *   "daysOverBudget": 2
 * }
 */

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface WeeklySummaryCardProps {
  expenses: Expense[];
  dailyBudget?: number;
  isDarkMode?: boolean;
}

export function WeeklySummaryCard({ 
  expenses, 
  dailyBudget,
  isDarkMode = false 
}: WeeklySummaryCardProps) {
  const [weekTotal, setWeekTotal] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [biggestExpense, setBiggestExpense] = useState<Expense | null>(null);
  const [daysOnBudget, setDaysOnBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // CALCULATE WEEK STATS
  // ═══════════════════════════════════════════════════════════
  
  const calculateWeekStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // Get this week's expenses
    const thisWeekExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= startOfWeek;
    });

    // Calculate week total
    const total = thisWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    setWeekTotal(total);

    // Find biggest expense
    if (thisWeekExpenses.length > 0) {
      const biggest = thisWeekExpenses.reduce((max, exp) => 
        exp.amount > max.amount ? exp : max
      );
      setBiggestExpense(biggest);
    }

    // Calculate weekly average (last 4 weeks)
    const fourWeeksAgo = new Date(startOfWeek);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const lastFourWeeks = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= fourWeeksAgo && expDate < startOfWeek;
    });

    const avgTotal = lastFourWeeks.reduce((sum, exp) => sum + exp.amount, 0);
    setWeeklyAverage(avgTotal / 4);

    // Calculate days on budget (if daily budget is set)
    if (dailyBudget) {
      const daysInWeek = now.getDay() + 1; // Include today
      const dailyTotals = new Map<string, number>();

      thisWeekExpenses.forEach(exp => {
        const date = new Date(exp.date).toISOString().split('T')[0];
        dailyTotals.set(date, (dailyTotals.get(date) || 0) + exp.amount);
      });

      let onBudget = 0;
      dailyTotals.forEach(total => {
        if (total <= dailyBudget) onBudget++;
      });

      setDaysOnBudget(onBudget);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // BACKEND API INTEGRATION
  // ═══════════════════════════════════════════════════════════
  
  const fetchWeeklySummary = async () => {
    setIsLoading(true);
    
    try {
      // TODO: BACKEND - Call GET /api/expenses/weekly-summary
      // const response = await fetch('/api/expenses/weekly-summary', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setWeekTotal(data.weekTotal);
      // setWeeklyAverage(data.weeklyAverage);
      // setBiggestExpense(data.biggestExpense);
      // setDaysOnBudget(data.daysOnBudget);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      calculateWeekStats();
    } catch (error) {
      console.error('Failed to fetch weekly summary:', error);
      calculateWeekStats(); // Fallback to local calculation
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySummary();
  }, [expenses, dailyBudget]);

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════
  
  const percentageChange = weeklyAverage > 0 
    ? ((weekTotal - weeklyAverage) / weeklyAverage) * 100 
    : 0;
  
  const isAboveAverage = weekTotal > weeklyAverage;
  const today = new Date().getDay() + 1; // Days elapsed this week

  if (isLoading) {
    return (
      <div className={`rounded-[20px] p-5 shadow-sm mb-5 border ${
        isDarkMode 
          ? 'bg-[#1c1c1e]/90 border-white/10' 
          : 'bg-white/80 border-black/5'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[20px] p-5 shadow-sm mb-5 border ${
      isDarkMode 
        ? 'bg-[#1c1c1e]/90 border-white/10' 
        : 'bg-white/80 border-black/5'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} strokeWidth={2.5} />
          <h3 className={`text-[17px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            This Week
          </h3>
        </div>

        {/* Trend Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
          isAboveAverage
            ? isDarkMode ? 'bg-[#ff453a]/10' : 'bg-[#ff3b30]/10'
            : isDarkMode ? 'bg-[#30d158]/10' : 'bg-[#34c759]/10'
        }`}>
          {isAboveAverage ? (
            <TrendingUp className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]'}`} strokeWidth={2.5} />
          ) : (
            <TrendingDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#30d158]' : 'text-[#34c759]'}`} strokeWidth={2.5} />
          )}
          <span className={`text-[11px] font-semibold ${
            isAboveAverage
              ? isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]'
              : isDarkMode ? 'text-[#30d158]' : 'text-[#34c759]'
          }`}>
            {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Week Total */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Spent
          </p>
          <p className={`text-[24px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ₹{weekTotal.toFixed(0)}
          </p>
        </div>

        {/* Average */}
        <div>
          <p className={`text-[13px] mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
            Avg/Week
          </p>
          <p className={`text-[24px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
            ₹{weeklyAverage.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className={`space-y-2 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/8'}`}>
        {/* Biggest Expense */}
        {biggestExpense && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className={`w-4 h-4 ${isDarkMode ? 'text-[#ffd60a]' : 'text-[#ffcc00]'}`} strokeWidth={2.5} />
              <span className={`text-[13px] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Biggest: {biggestExpense.description}
              </span>
            </div>
            <span className={`text-[13px] font-semibold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
              ₹{biggestExpense.amount.toFixed(0)}
            </span>
          </div>
        )}

        {/* Days on Budget */}
        {dailyBudget && daysOnBudget > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${isDarkMode ? 'text-[#30d158]' : 'text-[#34c759]'}`} strokeWidth={2.5} />
              <span className={`text-[13px] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Days on budget
              </span>
            </div>
            <span className={`text-[13px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {daysOnBudget}/{today}
            </span>
          </div>
        )}

        {/* Insight Message */}
        {isAboveAverage && weeklyAverage > 0 && (
          <div className={`p-2.5 rounded-[10px] ${
            isDarkMode ? 'bg-[#ff453a]/10' : 'bg-[#ff3b30]/5'
          }`}>
            <p className={`text-[12px] leading-relaxed ${
              isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]'
            }`}>
              📈 Spending is {percentageChange.toFixed(0)}% above your weekly average
            </p>
          </div>
        )}

        {!isAboveAverage && weeklyAverage > 0 && (
          <div className={`p-2.5 rounded-[10px] ${
            isDarkMode ? 'bg-[#30d158]/10' : 'bg-[#34c759]/5'
          }`}>
            <p className={`text-[12px] leading-relaxed ${
              isDarkMode ? 'text-[#30d158]' : 'text-[#34c759]'
            }`}>
              ✨ Great! You're spending less than usual this week
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
