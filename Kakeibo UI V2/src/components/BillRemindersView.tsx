import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Clock, CheckCircle2, AlertCircle, Calendar, IndianRupee, Trash2, Edit2 } from 'lucide-react';
import { toast } from '../utils/toast';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string; // ISO date string
  isPaid: boolean;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  notes?: string;
}

interface BillRemindersViewProps {
  onClose: () => void;
  isDarkMode: boolean;
  onAddExpense?: (expense: any) => void;
}

export function BillRemindersView({ onClose, isDarkMode, onAddExpense }: BillRemindersViewProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Load bills from localStorage
  useEffect(() => {
    const storedBills = localStorage.getItem('kakeibo_bills');
    if (storedBills) {
      setBills(JSON.parse(storedBills));
    }
  }, []);

  // Save bills to localStorage
  const saveBills = (updatedBills: Bill[]) => {
    setBills(updatedBills);
    localStorage.setItem('kakeibo_bills', JSON.stringify(updatedBills));
  };

  const handleMarkAsPaid = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    // Mark as paid
    const updatedBills = bills.map(b => 
      b.id === billId ? { ...b, isPaid: true } : b
    );

    // If recurring, create next bill
    if (bill.isRecurring && bill.frequency) {
      const nextBill = createNextRecurringBill(bill);
      updatedBills.push(nextBill);
    }

    saveBills(updatedBills);

    // Add to expenses if callback provided
    if (onAddExpense) {
      onAddExpense({
        description: bill.name,
        category: bill.category,
        amount: bill.amount,
        date: new Date().toISOString(),
      });
    }

    toast.success(`${bill.name} marked as paid!`);
  };

  const createNextRecurringBill = (bill: Bill): Bill => {
    const currentDate = new Date(bill.dueDate);
    let nextDate = new Date(currentDate);

    switch (bill.frequency) {
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }

    return {
      ...bill,
      id: Date.now().toString() + Math.random(),
      dueDate: nextDate.toISOString(),
      isPaid: false,
    };
  };

  const handleDeleteBill = (billId: string) => {
    const updatedBills = bills.filter(b => b.id !== billId);
    saveBills(updatedBills);
    toast.success('Bill deleted');
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (bill: Bill) => {
    if (bill.isPaid) return 'text-green-500';
    const daysUntil = getDaysUntilDue(bill.dueDate);
    if (daysUntil < 0) return 'text-red-500';
    if (daysUntil <= 3) return 'text-orange-500';
    return isDarkMode ? 'text-white/70' : 'text-black/70';
  };

  const getStatusIcon = (bill: Bill) => {
    if (bill.isPaid) return CheckCircle2;
    const daysUntil = getDaysUntilDue(bill.dueDate);
    if (daysUntil < 0) return AlertCircle;
    return Clock;
  };

  // Separate bills into categories
  const upcomingBills = bills.filter(b => !b.isPaid && getDaysUntilDue(b.dueDate) >= 0);
  const overdueBills = bills.filter(b => !b.isPaid && getDaysUntilDue(b.dueDate) < 0);
  const paidBills = bills.filter(b => b.isPaid);

  // Sort by due date
  const sortedUpcoming = [...upcomingBills].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const sortedOverdue = [...overdueBills].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const sortedPaid = [...paidBills].sort((a, b) => 
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  const totalUpcoming = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

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
                Bill Reminders
              </h2>
              <p className={`text-[15px] mt-1 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                Never miss a payment
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

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-4">
            <div className={`p-4 rounded-[14px] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <p className={`text-[13px] font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Upcoming
              </p>
              <p className={`text-[24px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                ₹{totalUpcoming.toFixed(2)}
              </p>
              <p className={`text-[12px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                {upcomingBills.length} bill{upcomingBills.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={`p-4 rounded-[14px] ${
              overdueBills.length > 0 
                ? (isDarkMode ? 'bg-red-500/10' : 'bg-red-50')
                : (isDarkMode ? 'bg-white/5' : 'bg-black/5')
            }`}>
              <p className={`text-[13px] font-medium mb-1 ${
                overdueBills.length > 0
                  ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                  : (isDarkMode ? 'text-white/50' : 'text-black/50')
              }`}>
                Overdue
              </p>
              <p className={`text-[24px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                ₹{totalOverdue.toFixed(2)}
              </p>
              <p className={`text-[12px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                {overdueBills.length} bill{overdueBills.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          <div className="p-5 space-y-6">
            {/* Overdue Bills */}
            {sortedOverdue.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  Overdue
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedOverdue.map((bill) => (
                      <BillItem
                        key={bill.id}
                        bill={bill}
                        isDarkMode={isDarkMode}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDelete={handleDeleteBill}
                        onEdit={setEditingBill}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        getDaysUntilDue={getDaysUntilDue}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Upcoming Bills */}
            {sortedUpcoming.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  Upcoming
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedUpcoming.map((bill) => (
                      <BillItem
                        key={bill.id}
                        bill={bill}
                        isDarkMode={isDarkMode}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDelete={handleDeleteBill}
                        onEdit={setEditingBill}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        getDaysUntilDue={getDaysUntilDue}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Paid Bills */}
            {sortedPaid.length > 0 && (
              <div>
                <h3 className={`text-[15px] font-semibold mb-3 uppercase tracking-wide ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  Paid This Month
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedPaid.map((bill) => (
                      <BillItem
                        key={bill.id}
                        bill={bill}
                        isDarkMode={isDarkMode}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDelete={handleDeleteBill}
                        onEdit={setEditingBill}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        getDaysUntilDue={getDaysUntilDue}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {bills.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
                <p className={`text-[17px] font-medium mb-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                  No bills added yet
                </p>
                <p className={`text-[15px] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  Add your first bill to get started
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Add Bill Button */}
        <div className={`sticky bottom-0 p-5 border-t backdrop-blur-xl ${
          isDarkMode ? 'bg-[#1c1c1e]/95 border-white/10' : 'bg-white/95 border-black/5'
        }`}>
          <button
            onClick={() => setIsAddingBill(true)}
            className={`w-full py-4 px-6 rounded-[14px] font-semibold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              isDarkMode
                ? 'bg-[#0a84ff] hover:bg-[#0077ed] text-white'
                : 'bg-[#007aff] hover:bg-[#0051d5] text-white'
            }`}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span>Add Bill Reminder</span>
          </button>
        </div>
      </motion.div>

      {/* Add/Edit Bill Modal */}
      {(isAddingBill || editingBill) && (
        <AddBillModal
          bill={editingBill}
          onClose={() => {
            setIsAddingBill(false);
            setEditingBill(null);
          }}
          onSave={(bill) => {
            if (editingBill) {
              // Edit existing
              const updatedBills = bills.map(b => b.id === bill.id ? bill : b);
              saveBills(updatedBills);
              toast.success('Bill updated!');
            } else {
              // Add new
              saveBills([...bills, bill]);
              toast.success('Bill reminder added!');
            }
            setIsAddingBill(false);
            setEditingBill(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </motion.div>
  );
}

// Bill Item Component
interface BillItemProps {
  bill: Bill;
  isDarkMode: boolean;
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (bill: Bill) => void;
  getStatusColor: (bill: Bill) => string;
  getStatusIcon: (bill: Bill) => any;
  getDaysUntilDue: (date: string) => number;
}

function BillItem({
  bill,
  isDarkMode,
  onMarkAsPaid,
  onDelete,
  onEdit,
  getStatusColor,
  getStatusIcon,
  getDaysUntilDue,
}: BillItemProps) {
  const StatusIcon = getStatusIcon(bill);
  const daysUntil = getDaysUntilDue(bill.dueDate);
  const dueDate = new Date(bill.dueDate);

  const getStatusText = () => {
    if (bill.isPaid) return 'Paid';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 rounded-[14px] border ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/3 border-black/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          bill.isPaid
            ? (isDarkMode ? 'bg-green-500/20' : 'bg-green-100')
            : daysUntil < 0
            ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-100')
            : (isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100')
        }`}>
          <StatusIcon className={`w-5 h-5 ${getStatusColor(bill)}`} strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-[17px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {bill.name}
            </h4>
            <p className={`text-[17px] font-bold tabular-nums flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              ₹{bill.amount.toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <p className={`text-[15px] ${getStatusColor(bill)}`}>
              {getStatusText()}
            </p>
            <span className={`text-[13px] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>•</span>
            <p className={`text-[15px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            {bill.isRecurring && (
              <>
                <span className={`text-[13px] ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>•</span>
                <p className={`text-[13px] ${isDarkMode ? 'text-white/40' : 'text-black/40'} capitalize`}>
                  {bill.frequency}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!bill.isPaid && (
              <button
                onClick={() => onMarkAsPaid(bill.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => onEdit(bill)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <Edit2 className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
            </button>
            <button
              onClick={() => onDelete(bill.id)}
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

// Add Bill Modal Component
interface AddBillModalProps {
  bill: Bill | null;
  onClose: () => void;
  onSave: (bill: Bill) => void;
  isDarkMode: boolean;
}

function AddBillModal({ bill, onClose, onSave, isDarkMode }: AddBillModalProps) {
  const [name, setName] = useState(bill?.name || '');
  const [amount, setAmount] = useState(bill?.amount.toString() || '');
  const [category, setCategory] = useState(bill?.category || 'utilities');
  const [dueDate, setDueDate] = useState(
    bill?.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : ''
  );
  const [isRecurring, setIsRecurring] = useState(bill?.isRecurring || false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(
    bill?.frequency || 'monthly'
  );
  const [notes, setNotes] = useState(bill?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newBill: Bill = {
      id: bill?.id || Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      dueDate: new Date(dueDate).toISOString(),
      isPaid: bill?.isPaid || false,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newBill);
  };

  const categories = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'loan', label: 'Loan/EMI' },
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
              {bill ? 'Edit Bill' : 'Add Bill Reminder'}
            </h3>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Bill Name */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Bill Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electricity Bill"
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
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-black/5 border-black/10 text-black'
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className={`block text-[15px] font-medium mb-2 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-black/5 border-black/10 text-black'
                }`}
                required
              />
            </div>

            {/* Recurring */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <span className={`text-[17px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  This is a recurring bill
                </span>
              </label>
            </div>

            {/* Frequency (if recurring) */}
            {isRecurring && (
              <div>
                <label className={`block text-[15px] font-medium mb-2 ${
                  isDarkMode ? 'text-white/70' : 'text-black/70'
                }`}>
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] border ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-black/5 border-black/10 text-black'
                  }`}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

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
                placeholder="Add any additional notes..."
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
              {bill ? 'Update' : 'Add'} Bill
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
