import { X, Repeat } from 'lucide-react';
import { useState } from 'react';
import { RecurringExpense } from '../services/api';

/**
 * Recurring Expense Modal Component
 * 
 * BACKEND INTEGRATION:
 * - Creates recurring expenses via POST /api/recurring-expenses
 * - Backend should have a scheduled job (Spring @Scheduled) to auto-generate expenses
 * - Job runs daily and checks all active recurring expenses
 * - Generates actual expenses based on frequency and lastGenerated date
 */

const categories = [
  { value: 'food', label: 'Food', icon: '🍴', color: 'from-[#ff6b6b] to-[#ee5a6f]' },
  { value: 'transport', label: 'Transport', icon: '🚂', color: 'from-[#4ecdc4] to-[#44a08d]' },
  { value: 'coffee', label: 'Coffee', icon: '☕', color: 'from-[#f7b731] to-[#fa8231]' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', color: 'from-[#a29bfe] to-[#6c5ce7]' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'from-[#fd79a8] to-[#e84393]' },
  { value: 'utilities', label: 'Utilities', icon: '⚡', color: 'from-[#00b894] to-[#00cec9]' },
  { value: 'other', label: 'Other', icon: '⋯', color: 'from-[#b2bec3] to-[#636e72]' },
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  isDarkMode?: boolean;
}

export function RecurringExpenseModal({ 
  isOpen, 
  onClose, 
  onSave,
  isDarkMode = false 
}: RecurringExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !category || !amount) {
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    // TODO: BACKEND INTEGRATION - Call createRecurringExpense API
    // POST /api/recurring-expenses
    // Backend will handle creating a scheduled job for this recurring expense
    
    onSave({
      description: description.trim(),
      category,
      amount: numAmount,
      frequency,
      startDate,
      endDate: hasEndDate && endDate ? endDate : undefined,
      isActive: true,
    });

    // Reset form
    setDescription('');
    setCategory('');
    setAmount('');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setHasEndDate(false);
    setEndDate('');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className={`rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051d5] flex items-center justify-center">
              <Repeat className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className={`text-[28px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Recurring Expense
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode 
                ? 'bg-[#2c2c2e] hover:bg-[#3c3c3e]' 
                : 'bg-[#f5f5f7] hover:bg-[#e5e5e7]'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Description */}
          <div>
            <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Netflix Subscription"
              className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                  : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
              }`}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className={`block text-[15px] font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-[14px] transition-all duration-200 border-2 ${
                      isSelected
                        ? isDarkMode
                          ? 'border-[#0a84ff] bg-[#0a84ff]/10'
                          : 'border-[#007aff] bg-[#007aff]/5'
                        : isDarkMode
                          ? 'border-transparent bg-[#2c2c2e] hover:bg-[#3c3c3e]'
                          : 'border-transparent bg-[#f5f5f7] hover:bg-[#e5e5e7]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-[20px]`}>
                        {cat.icon}
                      </div>
                      <span className={`text-[15px] font-semibold ${
                        isSelected 
                          ? isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]'
                          : isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Amount
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                    : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                }`}
              >
                {frequencies.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                  : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
              }`}
              required
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className={`text-[15px] font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Set End Date (Optional)
              </span>
            </label>
            {hasEndDate && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                    : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                }`}
              />
            )}
          </div>

          {/* Info Box */}
          <div className={`rounded-[12px] p-4 ${isDarkMode ? 'bg-[#0a84ff]/10' : 'bg-[#007aff]/5'}`}>
            <p className={`text-[13px] ${isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]'}`}>
              💡 This expense will be automatically added {frequency === 'monthly' ? 'every month' : frequency === 'weekly' ? 'every week' : frequency === 'daily' ? 'every day' : 'every year'} starting from {new Date(startDate).toLocaleDateString()}.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
              isDarkMode
                ? 'bg-white hover:bg-white/90 text-black'
                : 'bg-black hover:bg-black/90 text-white'
            }`}
          >
            Create Recurring Expense
          </button>
        </form>
      </div>
    </div>
  );
}
