import {
  X,
  Utensils,
  Train,
  Coffee,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Preferences } from "@capacitor/preferences";
import { motion, AnimatePresence } from "motion/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { createPortal } from "react-dom";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: {
    description: string;
    category: string;
    amount: number;
    expenseDateTime: string;
  }) => void;
  isDarkMode?: boolean;
  initialDate?: Date;
}

const categories = [
  {
    value: "food",
    label: "Food",
    color: "from-[#ff6b6b] to-[#ee5a6f]",
    icon: Utensils,
  },
  {
    value: "transport",
    label: "Transport",
    color: "from-[#4ecdc4] to-[#44a08d]",
    icon: Train,
  },
  {
    value: "coffee",
    label: "Coffee",
    color: "from-[#f7b731] to-[#fa8231]",
    icon: Coffee,
  },
  {
    value: "shopping",
    label: "Shopping",
    color: "from-[#a29bfe] to-[#6c5ce7]",
    icon: ShoppingBag,
  },
  {
    value: "entertainment",
    label: "Entertainment",
    color: "from-[#fd79a8] to-[#e84393]",
    icon: Film,
  },
  {
    value: "utilities",
    label: "Utilities",
    color: "from-[#00b894] to-[#00cec9]",
    icon: Zap,
  },
  {
    value: "other",
    label: "Other",
    color: "from-[#b2bec3] to-[#636e72]",
    icon: MoreHorizontal,
  },
];

export function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
  isDarkMode = false,
  initialDate,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [recentCategoryIds, setRecentCategoryIds] = useState<string[]>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Load recent categories
  useEffect(() => {
    (async () => {
      const { value } = await Preferences.get({
        key: "kakeibo_recent_categories",
      });
      if (value) {
        setRecentCategoryIds(JSON.parse(value));
      }
    })();
  }, []);

  // Scroll Look
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Clear state and auto-focus amount
      setDescription("");
      setCategory("");
      setAmount("");
      setIsCelebrating(false);
      setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus();
        }
      }, 400);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !category || !amount) {
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    // Save as recent category
    const updatedRecents = [
      category,
      ...recentCategoryIds.filter((id) => id !== category),
    ].slice(0, 3);
    setRecentCategoryIds(updatedRecents);
    await Preferences.set({
      key: "kakeibo_recent_categories",
      value: JSON.stringify(updatedRecents),
    });

    // Create a date object for the expense
    let expenseDate: Date;
    if (initialDate) {
      // Safely clone the initial date passed from the calendar
      expenseDate = new Date(initialDate.getTime());
    } else {
      expenseDate = new Date();
    }

    // Append the exact current time to the chosen date
    const now = new Date();
    expenseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    onAdd({
      description: description.trim(),
      category,
      amount: numAmount,
      expenseDateTime: expenseDate.toISOString(),
    });

    // Feature 5: Celebration Animation
    setIsCelebrating(true);
    await Haptics.impact({ style: ImpactStyle.Medium });

    // Success delay then close
    setTimeout(() => {
      setIsCelebrating(false);
      setDescription("");
      setCategory("");
      setAmount("");
      onClose();
    }, 1500);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setDescription("");
    setCategory("");
    setAmount("");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-10 safe-top sm:items-center sm:pt-0"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={handleOverlayClick}
    >
      <motion.div
        className={`relative rounded-[28px] sm:rounded-[24px] w-full max-w-md p-4 pb-6 sm:p-5 sm:pb-8 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar ${
          isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
        }`}
      >
        {/* Drag Handle (Mobile only) */}
        <div className="w-12 h-1.5 bg-gray-300/30 dark:bg-gray-600/30 rounded-full mx-auto mb-4 mt-[-4px] sm:hidden" />
        <AnimatePresence>
          {isCelebrating && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none rounded-[28px] overflow-hidden">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-green-500 rounded-full p-6 shadow-2xl z-10"
              >
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              {/* Confetti Particles */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 600,
                    opacity: 0,
                    scale: 0.5,
                    rotate: Math.random() * 720,
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: [
                      "#ff6b6b",
                      "#4ecdc4",
                      "#f7b731",
                      "#007aff",
                      "#a29bfe",
                      "#ff9ff3",
                    ][i % 6],
                    left: "50%",
                    top: "50%",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-[24px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Add Expense
          </h2>
          <button
            onClick={handleClose}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount (Premium Huge Input at Top) */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6">
            <span
              className={`text-[15px] font-semibold mb-2 uppercase tracking-wider ${
                isDarkMode ? "text-white/50" : "text-black/50"
              }`}
            >
              Amount
            </span>
            <div className="flex items-center justify-center gap-1">
              <span
                className={`text-[32px] font-bold ${
                  isDarkMode ? "text-white/40" : "text-black/40"
                }`}
              >
                ₹
              </span>
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-[200px] bg-transparent text-center text-[56px] font-bold tracking-tighter focus:outline-none placeholder:text-gray-300 ${isDarkMode ? "text-white" : "text-black"}`}
                required
                autoComplete="off"
              />
            </div>
          </div>
          {/* Expense Description */}
          <div>
            <label
              className={`block text-[15px] font-semibold mb-1.5 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Lunch at cafe"
              className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                  : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
              }`}
              required
            />
          </div>

          {/* Category Section */}
          <div>
            <label
              className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Category
            </label>

            {/* Feature 8: Recent Categories */}
            {recentCategoryIds.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-1 px-1">
                {recentCategoryIds.map((id) => {
                  const cat = categories.find((c) => c.value === id);
                  if (!cat) return null;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={`recent-${id}`}
                      type="button"
                      onClick={() => setCategory(id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                        category === id
                          ? "bg-[#007aff] border-[#007aff] text-white shadow-md shadow-[#007aff]/20"
                          : isDarkMode
                            ? "bg-[#2c2c2e] border-white/5 text-white/50"
                            : "bg-[#f5f5f7] border-black/5 text-black/50"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${category === id ? "text-white" : "text-gray-400"}`}
                      />
                      <span className="text-[13px] font-bold capitalize">
                        {id}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
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
                        ? isDarkMode
                          ? "border-[#0a84ff] bg-[#0a84ff]/10"
                          : "border-[#007aff] bg-[#007aff]/5"
                        : isDarkMode
                          ? "border-transparent bg-[#2c2c2e] hover:bg-[#3c3c3e]"
                          : "border-transparent bg-[#f5f5f7] hover:bg-[#e5e5e7]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <Icon
                          className="w-5 h-5 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                      <span
                        className={`text-[15px] font-semibold ${
                          isSelected
                            ? isDarkMode
                              ? "text-[#0a84ff]"
                              : "text-[#007aff]"
                            : isDarkMode
                              ? "text-white"
                              : "text-black"
                        }`}
                      >
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Display */}
          <div
            className={`rounded-[12px] px-4 py-3 ${isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"}`}
          >
            <p
              className={`text-[15px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              Date:{" "}
              <span
                className={`font-semibold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                {initialDate
                  ? initialDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Today"}
              </span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCelebrating}
            className={`w-full py-3.5 rounded-[14px] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] font-semibold text-[16px] text-white mt-4 border border-transparent ${
              isCelebrating
                ? "bg-green-500 shadow-lg shadow-green-500/25"
                : "bg-[#007aff] hover:bg-[#0066cc]"
            }`}
            style={
              !isCelebrating
                ? {
                    boxShadow: isDarkMode
                      ? "0 8px 24px rgba(10, 132, 255, 0.25)"
                      : "0 8px 24px rgba(0, 122, 255, 0.25)",
                  }
                : undefined
            }
          >
            {isCelebrating ? "Success!" : "Add Expense"}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
}
