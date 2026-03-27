import { motion } from 'motion/react';
import { Clock, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Bill } from './BillRemindersView';
import { RecurringExpense } from '../services/api';
import { calculateNextOccurrence } from '../utils/recurringUtils';

interface UpcomingBillsWidgetProps {
  onOpenBills: () => void;
  isDarkMode: boolean;
}

export function UpcomingBillsWidget({ onOpenBills, isDarkMode }: UpcomingBillsWidgetProps) {
  // Load regular bills
  const bills: Bill[] = JSON.parse(localStorage.getItem('kakeibo_bills') || '[]');
  
  // Load recurring expenses
  const recurringExpenses: RecurringExpense[] = JSON.parse(localStorage.getItem('kakeibo_recurring_expenses') || '[]');

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 1. Process regular bills
  const processedBills = bills.filter(b => !b.isPaid).map(b => ({
    id: b.id,
    name: b.name,
    amount: b.amount,
    dueDate: b.dueDate,
    type: 'bill' as const
  }));

  // 2. Process active recurring expenses
  const processedRecurring = recurringExpenses.filter(re => re.isActive).map(re => {
    const nextDate = calculateNextOccurrence(re.startDate, re.frequency, re.lastGenerated);
    return {
      id: re.id,
      name: re.description,
      amount: re.amount,
      dueDate: nextDate,
      type: 'recurring' as const
    };
  });

  // Combine both sources
  const allUpcoming = [...processedBills, ...processedRecurring].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Separate into urgent (within 7 days) and overdue
  const urgentItems = allUpcoming.filter(b => {
    const days = getDaysUntilDue(b.dueDate);
    return days >= 0 && days <= 7;
  });

  const overdueItems = allUpcoming.filter(b => getDaysUntilDue(b.dueDate) < 0);

  // If no urgent/overdue items, show the very next upcoming item for visibility
  const hasUrgent = overdueItems.length > 0 || urgentItems.length > 0;
  
  // COMPACT: Show only 2 items maximum in the widget
  const displayItems = hasUrgent 
    ? [...overdueItems, ...urgentItems].slice(0, 2) 
    : allUpcoming.slice(0, 1);

  // Don't show widget ONLY if there are absolutely no items
  if (allUpcoming.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mb-8"
    >
      <button
        onClick={onOpenBills}
        className={`w-full p-4 rounded-[20px] border transition-all active:scale-[0.98] relative overflow-hidden group ${
          overdueItems.length > 0
            ? (isDarkMode 
                ? 'bg-[#ff453a]/10 border-[#ff453a]/20' 
                : 'bg-red-50/80 border-red-100 shadow-sm shadow-red-500/5')
            : hasUrgent
              ? (isDarkMode
                  ? 'bg-[#ff9f0a]/10 border-[#ff9f0a]/20'
                  : 'bg-orange-50/80 border-orange-100 shadow-sm shadow-orange-500/5')
              : (isDarkMode
                  ? 'bg-[#0a84ff]/10 border-[#0a84ff]/20'
                  : 'bg-blue-50/80 border-blue-100 shadow-sm shadow-blue-500/5')
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              overdueItems.length > 0 
                ? (isDarkMode ? 'bg-[#ff453a]/20 text-[#ff453a]' : 'bg-red-100 text-red-600')
                : hasUrgent
                  ? (isDarkMode ? 'bg-[#ff9f0a]/20 text-[#ff9f0a]' : 'bg-orange-100 text-orange-600')
                  : (isDarkMode ? 'bg-[#0a84ff]/20 text-[#0a84ff]' : 'bg-blue-100 text-blue-600')
            }`}>
              {overdueItems.length > 0 ? (
                <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
              ) : hasUrgent ? (
                <Clock className="w-5 h-5" strokeWidth={2.5} />
              ) : (
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
              )}
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-[15px] font-bold leading-tight ${
                overdueItems.length > 0
                  ? (isDarkMode ? 'text-[#ff453a]' : 'text-red-900')
                  : hasUrgent
                    ? (isDarkMode ? 'text-[#ff9f0a]' : 'text-orange-900')
                    : (isDarkMode ? 'text-[#0a84ff]' : 'text-blue-900')
              }`}>
                {overdueItems.length > 0 ? 'Urgent Action' : hasUrgent ? 'Upcoming Payments' : 'On Track'}
              </h3>
              <p className={`text-[12px] font-medium opacity-60 truncate ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {overdueItems.length > 0 
                  ? `${overdueItems.length} overdue item${overdueItems.length > 1 ? 's' : ''}` 
                  : hasUrgent
                    ? `${urgentItems.length} payment${urgentItems.length > 1 ? 's' : ''} next 7 days`
                    : 'Everything organized!'
                }
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold ${
            isDarkMode ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'
          }`}>
             View all
             <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </div>

        <div className="space-y-2.5">
          {displayItems.map((item) => {
            const daysUntil = getDaysUntilDue(item.dueDate);
            const isOverdue = daysUntil < 0;
            
            return (
              <div key={`${item.type}-${item.id}`} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isDarkMode 
                  ? 'bg-black/20 border-white/5 group-hover:bg-black/30' 
                  : 'bg-white/60 border-black/5 group-hover:bg-white/80 shadow-sm'
              }`}>
                <div className="flex-1 min-w-0 mr-3 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={`text-[15px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {item.name}
                    </p>
                    {item.type === 'recurring' && (
                      <span className={`text-[9px] px-1.2 py-0.2 rounded-full font-black uppercase ${
                        isDarkMode ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/40'
                      }`}>
                        Auto
                      </span>
                    )}
                  </div>
                  <p className={`text-[12px] font-bold ${
                    isOverdue
                      ? (isDarkMode ? 'text-[#ff453a]' : 'text-red-500')
                      : (isDarkMode ? 'text-white/40' : 'text-black/40')
                  }`}>
                    {isOverdue 
                      ? `${Math.abs(daysUntil)}d overdue`
                      : daysUntil === 0 
                        ? 'Due today' 
                        : daysUntil === 1
                          ? 'Due tomorrow'
                          : `In ${daysUntil} days`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[16px] font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    ₹{item.amount.toFixed(0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {allUpcoming.length > displayItems.length && (
          <div className="mt-3 flex justify-center">
             <div className={`h-1 w-8 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />
          </div>
        )}
      </button>
    </motion.div>
  );
}
