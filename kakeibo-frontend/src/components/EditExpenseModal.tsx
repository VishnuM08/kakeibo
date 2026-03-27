import { ArrowLeft, Trash2, Check, Utensils, ShoppingCart, Car, Coffee, Home, Film, Heart, Zap, TrendingUp, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { toast, Toaster } from "../utils/toast";

/**
 * Edit Expense Modal Component (Premium UI)
 */

// Category configuration (perfect match with AddExpenseModal)
const categories = [
  { id: 'food', name: 'Food', icon: <Utensils className="w-5 h-5" />, color: '#FF6B6B' },
  { id: 'groceries', name: 'Groceries', icon: <ShoppingCart className="w-5 h-5" />, color: '#4ECDC4' },
  { id: 'transport', name: 'Transport', icon: <Car className="w-5 h-5" />, color: '#45B7D1' },
  { id: 'coffee', name: 'Coffee', icon: <Coffee className="w-5 h-5" />, color: '#FFA07A' },
  { id: 'home', name: 'Home', icon: <Home className="w-5 h-5" />, color: '#98D8C8' },
  { id: 'entertainment', name: 'Fun', icon: <Film className="w-5 h-5" />, color: '#F7B731' },
  { id: 'health', name: 'Health', icon: <Heart className="w-5 h-5" />, color: '#FA8072' },
  { id: 'bills', name: 'Bills', icon: <Zap className="w-5 h-5" />, color: '#6C5CE7' },
  { id: 'shopping', name: 'Shopping', icon: <TrendingUp className="w-5 h-5" />, color: '#FD79A8' },
];

// Fallback categories for legacy data
const legacyCategories = [
  ...categories,
  { id: 'utilities', name: 'Utilities', icon: <Zap className="w-5 h-5" />, color: '#00b894' },
  { id: 'other', name: 'Other', icon: <MoreHorizontal className="w-5 h-5" />, color: '#b2bec3' },
];

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onSave: (expense: any) => void;
  onDelete: (id: string) => void;
  isDarkMode?: boolean;
}

export function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  onSave,
  onDelete,
  isDarkMode = false,
}: EditExpenseModalProps) {
  const [description, setDescription] = useState(expense.description || "");
  const [category, setCategory] = useState(expense.category || "");
  const [amount, setAmount] = useState(expense.amount?.toString() || "");

  // Scroll Lock
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(value);
  };

  const isFormValid = (amount && parseFloat(amount) > 0) && category;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const numAmount = parseFloat(amount);
    const updatedExpense: any = {
      ...expense,
      description: description.trim(),
      category,
      amount: numAmount,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedExpense);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      onDelete(expense.id);
      onClose();
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100000] h-[100dvh] w-screen flex flex-col items-center ${isDarkMode ? 'bg-black' : 'bg-[#f5f5f7]'} transition-colors duration-300`}>
      <Toaster position="top-center" isDarkMode={isDarkMode} />
      
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className={`flex-none backdrop-blur-xl border-b z-40 shadow-lg transition-colors ${isDarkMode ? 'bg-black/80 border-white/10 shadow-black/50' : 'bg-white/80 border-black/10 shadow-black/5'}`}>
          <div className="px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top, 44px), 44px)' }}>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#1c1c1e]' : 'hover:bg-black/5'}`}>
                <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </button>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Edit Expense</div>
            </div>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-lg transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          
          {/* Amount Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="bg-gradient-to-br from-[#007aff] via-[#007aff] to-[#0051d5] rounded-3xl p-6 shadow-2xl shadow-[#007aff]/30 border border-[#007aff]/30">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-2"
              >
                <span className="text-3xl text-white font-light">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="bg-transparent text-4xl font-bold text-white placeholder:text-white/40 focus:outline-none text-center w-full min-w-[50px]"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <label className="text-xs text-black/45 mb-2 block font-medium">
              CATEGORY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {legacyCategories.map((cat) => {
                const isSelected = category === cat.id;
                
                // Hide legacy categories if not selected to keep UI clean
                if (!categories.find(c => c.id === cat.id) && !isSelected) {
                  return null;
                }

                return (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setCategory(cat.id)}
                    style={
                      !isSelected 
                        ? { 
                            background: isDarkMode 
                              ? `linear-gradient(135deg, ${cat.color}10, ${cat.color}05)`
                              : `linear-gradient(135deg, ${cat.color}15, white)`,
                            borderColor: `${cat.color}20`
                          } 
                        : {}
                    }
                    className={`relative p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#007aff] border-2 border-[#007aff] shadow-lg shadow-[#007aff]/30'
                        : isDarkMode ? 'border-2' : 'border border-black/10 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-white/20' : isDarkMode ? 'bg-[#2c2c2e]' : 'bg-white shadow-sm'
                        }`}
                        style={!isSelected ? { color: cat.color } : {}}
                      >
                        <div className={isSelected ? 'text-white' : ''}>
                          {cat.icon}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium transition-colors ${
                          isSelected ? 'text-white' : isDarkMode ? 'text-white/50' : 'text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"
                      >
                        <Check className="w-3 h-3 text-[#007aff]" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4"
          >
            <label className="text-xs text-black/45 mb-2 block font-medium">
              DESCRIPTION <span className="text-white/50 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you buy?"
              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-[#007aff] transition-all ${
                isDarkMode 
                  ? 'bg-[#1c1c1e] border border-white/10 text-white placeholder:text-black/60' 
                  : 'bg-white border border-black/10 text-black placeholder:text-white/50 shadow-sm focus:ring-4 focus:ring-[#007aff]/10'
              }`}
            />
          </motion.div>

        </div>

        {/* Save Button */}
        <div className={`flex-none w-full backdrop-blur-md border-t p-4 z-50 transition-colors ${
          isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
        }`} style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          paddingTop: '16px'
        }}>
          <div className="w-full relative">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full py-4 rounded-2xl font-semibold text-base shadow-lg transition-all active:scale-[0.98] ${
                isFormValid
                  ? 'bg-[#007aff] hover:bg-[#0051D5] text-white shadow-[#007aff]/30'
                  : isDarkMode
                    ? 'bg-[#1c1c1e] text-white/30 cursor-not-allowed border border-white/5'
                    : 'bg-black/5 text-black/40 cursor-not-allowed border border-black/10 shadow-sm'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
