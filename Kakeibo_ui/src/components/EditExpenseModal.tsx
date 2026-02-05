import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Expense } from '../services/api';

/**
 * Edit Expense Modal Component
 * 
 * BACKEND INTEGRATION:
 * - Calls updateExpense API when user saves changes
 * - Handles receipt upload via uploadReceipt API
 * - Updates are sent to Spring Boot backend via PUT /api/expenses/{id}
 */

// Category configuration with icons (matching AddExpenseModal)
const categories = [
  { value: 'food', label: 'Food', icon: '🍴', color: 'from-[#ff6b6b] to-[#ee5a6f]' },
  { value: 'transport', label: 'Transport', icon: '🚂', color: 'from-[#4ecdc4] to-[#44a08d]' },
  { value: 'coffee', label: 'Coffee', icon: '☕', color: 'from-[#f7b731] to-[#fa8231]' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', color: 'from-[#a29bfe] to-[#6c5ce7]' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'from-[#fd79a8] to-[#e84393]' },
  { value: 'utilities', label: 'Utilities', icon: '⚡', color: 'from-[#00b894] to-[#00cec9]' },
  { value: 'other', label: 'Other', icon: '⋯', color: 'from-[#b2bec3] to-[#636e72]' },
];

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isDarkMode?: boolean;
}

export function EditExpenseModal({ 
  isOpen, 
  onClose, 
  expense, 
  onSave, 
  onDelete,
  isDarkMode = false 
}: EditExpenseModalProps) {
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [notes, setNotes] = useState(expense.notes || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(expense.receiptUrl || null);

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

    // TODO: BACKEND INTEGRATION - Upload receipt if new file selected
    let receiptUrl = receiptPreview;
    // if (receiptFile) {
    //   receiptUrl = await uploadReceipt(receiptFile);
    // }

    const updatedExpense: Expense = {
      ...expense,
      description: description.trim(),
      category,
      amount: numAmount,
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
      updatedAt: new Date().toISOString(),
    };

    // TODO: BACKEND INTEGRATION - Call updateExpense API
    // await updateExpense(expense.id, updatedExpense);
    
    onSave(updatedExpense);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      // TODO: BACKEND INTEGRATION - Call deleteExpense API
      // await deleteExpense(expense.id);
      
      onDelete(expense.id);
      onClose();
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const categoryInfo = categories.find(cat => cat.value === category);

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
          <h2 className={`text-[28px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Edit Expense
          </h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Expense Description */}
          <div>
            <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Lunch at cafe"
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
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-sm text-[20px]`}>
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

          {/* Amount */}
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

          {/* Notes */}
          <div>
            <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className={`w-full px-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 resize-none ${
                isDarkMode
                  ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                  : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
              }`}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Receipt (Optional)
            </label>
            
            {receiptPreview ? (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Receipt"
                  className={`w-full h-48 object-cover rounded-[12px] border-2 ${
                    isDarkMode ? 'border-[#2c2c2e]' : 'border-[#f5f5f7]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPreview(null);
                    setReceiptFile(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <label className={`w-full h-32 rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-[#2c2c2e] hover:border-[#0a84ff] hover:bg-[#0a84ff]/5'
                  : 'border-[#e5e5e7] hover:border-[#007aff] hover:bg-[#007aff]/5'
              }`}>
                <Upload className={`w-8 h-8 mb-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                <p className={`text-[15px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                  Tap to upload receipt
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className={`flex-1 py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
                isDarkMode
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              Delete
            </button>
            <button
              type="submit"
              className={`flex-1 py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
                isDarkMode
                  ? 'bg-white hover:bg-white/90 text-black'
                  : 'bg-black hover:bg-black/90 text-white'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
