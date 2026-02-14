import { X, Target } from "lucide-react";
import { useState } from "react";


interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number | null;
  onSaveBudget: (budget: number) => void;
  isDarkMode?: boolean;
}

export function BudgetSettingsModal({
  isOpen,
  onClose,
  currentBudget,
  onSaveBudget,
  isDarkMode,
}: BudgetSettingsModalProps) {
  const [budget, setBudget] = useState(currentBudget?.toString() || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      return;
    }

    onSaveBudget(numBudget);
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
              <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[28px] font-bold text-black">Monthly Budget</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
          >
            <X className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        </div>

        {/* Description */}
        <p className="text-[15px] text-black/60 mb-6">
          Set your monthly spending limit. You'll receive warnings when
          approaching or exceeding this amount.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Budget Amount */}
          <div>
            <label className="block text-[15px] font-semibold text-black mb-2">
              Monthly Limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[24px] text-black font-semibold">
                ₹
              </span>
              <input
                type="number"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-10 pr-4 py-4 bg-[#f5f5f7] rounded-[12px] text-[24px] font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#34c759]"
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#fff3cd] border border-[#ffc107]/30 rounded-[12px] p-4">
            <p className="text-[13px] text-[#856404] leading-relaxed">
              💡 <span className="font-semibold">Tip:</span> Based on the
              Kakeibo method, aim to save at least 20% of your income each
              month.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-[#34c759] to-[#30d158] hover:from-[#30b350] hover:to-[#2bc44e] text-white py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] mt-6 shadow-sm"
          >
            Save Budget
          </button>
        </form>
      </div>
    </div>
  );
}
