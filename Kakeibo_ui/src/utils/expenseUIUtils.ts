import {
  Coffee,
  Utensils,
  Train,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import type { Expense as BackendExpense, Expense } from "../services/api";
import type { UIExpennse } from "../types/UIExpense";

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, typeof Coffee> = {
    food: Utensils,
    transport: Train,
    coffee: Coffee,
    shopping: ShoppingBag,
    entertainment: Film,
    utilities: Zap,
    other: MoreHorizontal,
  };

  return icons[category.toLowerCase()] || Coffee;
};

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    food: "from-[#ff6b6b] to-[#ee5a6f]",
    transport: "from-[#4ecdc4] to-[#44a08d]",
    coffee: "from-[#f7b731] to-[#fa8231]",
    shopping: "from-[#a29bfe] to-[#6c5ce7]",
    entertainment: "from-[#fd79a8] to-[#e84393]",
    utilities: "from-[#00b894] to-[#00cec9]",
    other: "from-[#b2bec3] to-[#636e72]",
  };

  return colors[category.toLowerCase()] || "from-[#b2bec3] to-[#636e72]";
};

/*
export const mapApiExpenseToUI = (expense: BackendExpense): UIExpense => {
  return {
    id: expense.id,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,

    // UI-only fields
    icon: getCategoryIcon(expense.category),
    color: getCategoryColor(expense.category),
    time: new Date(expense.date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };

  
};
*/

// utils/expenseUIUtils.ts
export function mapApiExpenseToUI(api: Expense): UIExpense {
  return {
    id: api.id,
    description: api.description,
    category: api.category,
    amount: api.amount,

    // 🔑 normalize backend field
    date: api.expenseDate,

    icon: getCategoryIcon(api.category),
    color: getCategoryColor(api.category),
    time: new Date(api.expenseDate).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),

    notes: api.notes,
    receiptUrl: api.receiptUrl,
  };
}
