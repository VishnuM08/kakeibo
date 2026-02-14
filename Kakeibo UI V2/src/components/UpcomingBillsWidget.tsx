import { motion } from 'motion/react';
import { Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Bill } from './BillRemindersView';

interface UpcomingBillsWidgetProps {
  onOpenBills: () => void;
  isDarkMode: boolean;
}

export function UpcomingBillsWidget({ onOpenBills, isDarkMode }: UpcomingBillsWidgetProps) {
  const bills: Bill[] = JSON.parse(localStorage.getItem('kakeibo_bills') || '[]');

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Get unpaid bills
  const unpaidBills = bills.filter(b => !b.isPaid);
  
  // Separate into urgent (within 7 days) and overdue
  const urgentBills = unpaidBills.filter(b => {
    const days = getDaysUntilDue(b.dueDate);
    return days >= 0 && days <= 7;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueBills = unpaidBills.filter(b => getDaysUntilDue(b.dueDate) < 0);

  // Show top 2 bills
  const displayBills = [...overdueBills, ...urgentBills].slice(0, 2);

  // Don't show widget if no bills
  if (displayBills.length === 0) return null;

  const totalAmount = displayBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mb-5"
    >
      <button
        onClick={onOpenBills}
        className={`w-full p-4 rounded-[20px] border transition-all active:scale-[0.98] ${
          overdueBills.length > 0
            ? (isDarkMode 
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15' 
                : 'bg-red-50 border-red-200 hover:bg-red-100')
            : (isDarkMode
                ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15'
                : 'bg-orange-50 border-orange-200 hover:bg-orange-100')
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {overdueBills.length > 0 ? (
              <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} strokeWidth={2.5} />
            ) : (
              <Clock className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} strokeWidth={2.5} />
            )}
            <h3 className={`text-[17px] font-semibold ${
              overdueBills.length > 0
                ? (isDarkMode ? 'text-red-400' : 'text-red-700')
                : (isDarkMode ? 'text-orange-400' : 'text-orange-700')
            }`}>
              {overdueBills.length > 0 ? 'Overdue Bills' : 'Upcoming Bills'}
            </h3>
          </div>
          <ChevronRight className={`w-5 h-5 ${
            overdueBills.length > 0
              ? (isDarkMode ? 'text-red-400' : 'text-red-600')
              : (isDarkMode ? 'text-orange-400' : 'text-orange-600')
          }`} />
        </div>

        <div className="space-y-2 mb-3">
          {displayBills.map((bill) => {
            const daysUntil = getDaysUntilDue(bill.dueDate);
            const isOverdue = daysUntil < 0;
            
            return (
              <div key={bill.id} className="flex items-center justify-between text-left">
                <div className="flex-1 min-w-0 mr-3">
                  <p className={`text-[15px] font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {bill.name}
                  </p>
                  <p className={`text-[13px] ${
                    isOverdue
                      ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                      : (isDarkMode ? 'text-white/50' : 'text-black/50')
                  }`}>
                    {isOverdue 
                      ? `${Math.abs(daysUntil)} days overdue`
                      : daysUntil === 0 
                        ? 'Due today' 
                        : daysUntil === 1
                          ? 'Due tomorrow'
                          : `Due in ${daysUntil} days`
                    }
                  </p>
                </div>
                <p className={`text-[15px] font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  ₹{bill.amount.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className={`pt-3 border-t ${
          overdueBills.length > 0
            ? (isDarkMode ? 'border-red-500/20' : 'border-red-300')
            : (isDarkMode ? 'border-orange-500/20' : 'border-orange-300')
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-[13px] font-medium ${
              overdueBills.length > 0
                ? (isDarkMode ? 'text-red-400/70' : 'text-red-600/70')
                : (isDarkMode ? 'text-orange-400/70' : 'text-orange-600/70')
            }`}>
              {unpaidBills.length > 2 ? `${unpaidBills.length - 2} more bill${unpaidBills.length - 2 !== 1 ? 's' : ''}` : 'Total'}
            </p>
            <p className={`text-[17px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
