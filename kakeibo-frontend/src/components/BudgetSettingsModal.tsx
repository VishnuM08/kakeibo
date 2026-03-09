import { X, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

  // Scroll Look
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-6 sm:items-center sm:pt-0"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={handleOverlayClick}
    >
      <div
        className={`rounded-[28px] sm:rounded-[28px] w-full max-w-lg p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
              <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2
              className={`text-[28px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Monthly Budget
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-[#2c2c2e] hover:bg-[#3c3c3e]"
                : "bg-[#f5f5f7] hover:bg-[#e5e5e7]"
            }`}
          >
            <X
              className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Description */}
        <p
          className={`text-[15px] mb-6 ${isDarkMode ? "text-white/60" : "text-black/60"}`}
        >
          Set your monthly spending limit. You'll receive warnings when
          approaching or exceeding this amount.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Budget Amount */}
          <div>
            <label
              className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Monthly Limit
            </label>
            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-[24px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1000.00"
                className={`w-full pl-10 pr-4 py-4 rounded-[12px] text-[24px] font-bold focus:outline-none focus:ring-2 focus:ring-[#34c759] ${
                  isDarkMode
                    ? "bg-[#2c2c2e] text-white placeholder:text-white/30"
                    : "bg-[#f5f5f7] text-black placeholder:text-black/30"
                }`}
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div
            className={`rounded-[12px] p-4 border ${
              isDarkMode
                ? "bg-[#fff3cd]/10 border-[#ffc107]/20"
                : "bg-[#fff3cd] border-[#ffc107]/30"
            }`}
          >
            <p
              className={`text-[13px] leading-relaxed ${isDarkMode ? "text-[#fff3cd]/80" : "text-[#856404]"}`}
            >
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
    </div>,
    document.body,
  );
}
