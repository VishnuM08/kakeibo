import { X, Utensils, Train, Coffee, ShoppingBag, Film, Zap, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: {
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => void;
}

const categories = [
  { value: 'food', label: 'Food', color: 'from-[#ff6b6b] to-[#ee5a6f]', icon: Utensils },
  { value: 'transport', label: 'Transport', color: 'from-[#4ecdc4] to-[#44a08d]', icon: Train },
  { value: 'coffee', label: 'Coffee', color: 'from-[#f7b731] to-[#fa8231]', icon: Coffee },
  { value: 'shopping', label: 'Shopping', color: 'from-[#a29bfe] to-[#6c5ce7]', icon: ShoppingBag },
  { value: 'entertainment', label: 'Entertainment', color: 'from-[#fd79a8] to-[#e84393]', icon: Film },
  { value: 'utilities', label: 'Utilities', color: 'from-[#00b894] to-[#00cec9]', icon: Zap },
  { value: 'other', label: 'Other', color: 'from-[#b2bec3] to-[#636e72]', icon: MoreHorizontal },
];

export function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

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

    // Create a date object for today at the current time
    const now = new Date();
    
    onAdd({
      description: description.trim(),
      category,
      amount: numAmount,
      date: now.toISOString(),
    });

    // Reset form
    setDescription('');
    setCategory('');
    setAmount('');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[28px] font-bold text-black">Add Expense</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
          >
            <X className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Expense Description */}
          <div>
            <label className="block text-[15px] font-semibold text-black mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Lunch at cafe"
              className="w-full px-4 py-3.5 bg-[#f5f5f7] rounded-[12px] text-[17px] text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#007aff]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[15px] font-semibold text-black mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-[14px] transition-all duration-200 border-2 ${
                      isSelected
                        ? 'border-[#007aff] bg-[#007aff]/5'
                        : 'border-transparent bg-[#f5f5f7] hover:bg-[#e5e5e7]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <span className={`text-[15px] font-semibold ${
                        isSelected ? 'text-[#007aff]' : 'text-black'
                      }`}>
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[15px] font-semibold text-black mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-black/50 font-semibold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3.5 bg-[#f5f5f7] rounded-[12px] text-[17px] text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#007aff]"
                required
              />
            </div>
          </div>

          {/* Date Display (Today) */}
          <div className="bg-[#f5f5f7] rounded-[12px] px-4 py-3">
            <p className="text-[15px] text-black/50">
              Date: <span className="font-semibold text-black">Today</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-black/90 text-white py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] mt-6"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}