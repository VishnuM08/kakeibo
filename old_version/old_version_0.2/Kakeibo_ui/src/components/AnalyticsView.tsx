import { ArrowLeft, TrendingUp, PieChart } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

interface AnalyticsViewProps {
  expenses: Expense[];
  onClose: () => void;
}

const categoryData = [
  { value: 'food', label: 'Food', color: '#ff6b6b', lightColor: 'from-[#ff6b6b] to-[#ee5a6f]' },
  { value: 'transport', label: 'Transport', color: '#4ecdc4', lightColor: 'from-[#4ecdc4] to-[#44a08d]' },
  { value: 'coffee', label: 'Coffee', color: '#f7b731', lightColor: 'from-[#f7b731] to-[#fa8231]' },
  { value: 'shopping', label: 'Shopping', color: '#a29bfe', lightColor: 'from-[#a29bfe] to-[#6c5ce7]' },
  { value: 'entertainment', label: 'Entertainment', color: '#fd79a8', lightColor: 'from-[#fd79a8] to-[#e84393]' },
  { value: 'utilities', label: 'Utilities', color: '#00b894', lightColor: 'from-[#00b894] to-[#00cec9]' },
  { value: 'other', label: 'Other', color: '#b2bec3', lightColor: 'from-[#b2bec3] to-[#636e72]' },
];

export function AnalyticsView({ expenses, onClose }: AnalyticsViewProps) {
  // Get current month expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate category breakdown
  const categoryBreakdown = categoryData.map(cat => {
    const categoryExpenses = monthExpenses.filter(
      exp => exp.category.toLowerCase() === cat.value
    );
    const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    
    return {
      ...cat,
      total,
      percentage,
      count: categoryExpenses.length,
    };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  // Calculate stats
  const totalTransactions = monthExpenses.length;
  const averageTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0;

  const monthName = now.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

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
            Analytics
          </h1>
        </div>

        {/* Total Spending Card */}
        <div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6 mb-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-white/80" strokeWidth={2.5} />
            <p className="text-white/80 text-[13px] font-semibold uppercase tracking-wider">
              {monthName}
            </p>
          </div>
          <p className="text-white text-[48px] font-bold tracking-tighter mb-1">
            ${totalSpent.toFixed(2)}
          </p>
          <p className="text-white/70 text-[15px]">
            Total Spent • {totalTransactions} transactions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <p className="text-[13px] text-black/50 font-semibold mb-1">
              Daily Average
            </p>
            <p className="text-[28px] font-bold text-black">
              ${dailyAverage.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-[16px] p-4 shadow-sm">
            <p className="text-[13px] text-black/50 font-semibold mb-1">
              Per Transaction
            </p>
            <p className="text-[28px] font-bold text-black">
              ${averageTransaction.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm mb-5">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-5 h-5 text-black" strokeWidth={2.5} />
            <h2 className="text-[20px] font-bold text-black">
              Category Breakdown
            </h2>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.value}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[15px] font-semibold text-black">
                        {cat.label}
                      </span>
                      <span className="text-[13px] text-black/40">
                        ({cat.count})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] font-bold text-black">
                        ${cat.total.toFixed(2)}
                      </p>
                      <p className="text-[13px] text-black/40">
                        {cat.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${cat.lightColor} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[15px] text-black/40">
                No expenses to analyze yet
              </p>
            </div>
          )}
        </div>

        {/* Insights */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-gradient-to-br from-[#f7b731] to-[#fa8231] rounded-[20px] p-5 shadow-sm">
            <h3 className="text-[17px] font-bold text-white mb-3">
              💡 Insights
            </h3>
            <div className="space-y-2">
              <p className="text-[15px] text-white/90 leading-relaxed">
                • Your top spending category is <span className="font-bold">{categoryBreakdown[0].label}</span> ({categoryBreakdown[0].percentage.toFixed(0)}%)
              </p>
              {dailyAverage > 0 && (
                <p className="text-[15px] text-white/90 leading-relaxed">
                  • At current pace, you'll spend ${(dailyAverage * daysInMonth).toFixed(2)} this month
                </p>
              )}
              {categoryBreakdown.length > 1 && (
                <p className="text-[15px] text-white/90 leading-relaxed">
                  • You're spending across {categoryBreakdown.length} different categories
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
