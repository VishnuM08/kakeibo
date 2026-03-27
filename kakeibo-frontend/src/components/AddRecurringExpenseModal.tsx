import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { RecurringExpense } from "../services/api";
import { message } from "antd";

interface AddRecurringExpenseModalProps {
  expense: RecurringExpense | undefined;
  onClose: () => void;
  onSave: (expense: any) => void;
  isDarkMode: boolean;
}

export function AddRecurringExpenseModal({ expense, onClose, onSave, isDarkMode }: AddRecurringExpenseModalProps) {
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [category, setCategory] = useState(expense?.category || "utilities");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">(expense?.frequency || "monthly");
  const [startDate, setStartDate] = useState(expense?.startDate ? new Date(expense.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      message.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Construct the data according to RecurringExpense interface
      // Note: id, userId, createdAt, updatedAt are usually handled by backend for NEW expenses
      // but for updates we might need them or the backend might prefer a Partial
      const data: any = {
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        frequency,
        startDate: new Date(startDate).toISOString(),
        isActive: expense?.isActive ?? true,
      };

      await onSave(data);
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "food", label: "Food & Dining" },
    { value: "transport", label: "Transport" },
    { value: "utilities", label: "Utilities" },
    { value: "entertainment", label: "Entertainment" },
    { value: "shopping", label: "Shopping" },
    { value: "coffee", label: "Coffee & Snacks" },
    { value: "other", label: "Other" },
  ];

  return createPortal(
    <div 
      className="fixed inset-0 w-full h-full z-[100000] flex items-center justify-center p-4"
      style={{ 
        backgroundColor: "rgba(0, 0, 0, 0.7)", 
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-slide-up ${isDarkMode ? "bg-[#1c1c1e] text-white" : "bg-white text-black"}`}
        style={{ maxHeight: '90vh' }}
      >
        <form onSubmit={handleSubmit}>
          <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-black/5"}`}>
            <h3 className="text-[20px] font-bold">
              {expense ? "Edit Recurring Expense" : "Add Recurring Expense"}
            </h3>
            <button type="button" onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <X className="w-5 h-5 opacity-50" />
            </button>
          </div>
          
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar no-scrollbar">
            <div>
              <label className={`block text-[14px] font-medium mb-1.5 opacity-60`}>Description</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Rent, Netflix, Gym..."
                className={`w-full px-4 py-3 rounded-[14px] text-[17px] border transition-all focus:ring-2 focus:ring-[#007aff] outline-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[14px] font-medium mb-1.5 opacity-60`}>Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00"
                  className={`w-full px-4 py-3 rounded-[14px] text-[17px] border transition-all focus:ring-2 focus:ring-[#007aff] outline-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`} 
                  required 
                />
              </div>
              <div>
                <label className={`block text-[14px] font-medium mb-1.5 opacity-60`}>Category</label>
                <div className="relative">
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className={`w-full px-4 py-3 rounded-[14px] text-[17px] border appearance-none outline-none ${isDarkMode ? "bg-[#2c2c2e] text-white border-white/10" : "bg-white text-black border-black/10"}`}
                  >
                    {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-[14px] font-medium mb-1.5 opacity-60`}>Frequency</label>
                <div className="relative">
                  <select 
                    value={frequency} 
                    onChange={(e) => setFrequency(e.target.value as any)} 
                    className={`w-full px-4 py-3 rounded-[14px] text-[17px] border appearance-none outline-none ${isDarkMode ? "bg-[#2c2c2e] text-white border-white/10" : "bg-white text-black border-black/10"}`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-[14px] font-medium mb-1.5 opacity-60`}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className={`w-full px-4 py-3 rounded-[14px] text-[17px] border outline-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`} 
                />
              </div>
            </div>
          </div>

          <div className={`p-6 border-t flex gap-3 ${isDarkMode ? "border-white/10" : "border-black/5"}`}>
            <button 
              type="button" 
              onClick={onClose} 
              className={`flex-1 py-3.5 rounded-[16px] font-semibold text-[17px] transition-all active:scale-[0.98] ${isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-black"}`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 py-3.5 rounded-[16px] font-semibold text-[17px] bg-[#007aff] text-white disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : expense ? "Save Changes" : "Create Recurring"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
