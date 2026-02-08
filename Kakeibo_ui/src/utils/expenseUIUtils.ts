import {
  Coffee,
  Utensils,
  Train,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import type { BackendExpense } from "../types/BackendExpense";
import type { UIExpense } from "../types/UIExpense";

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

export function mapApiExpenseToUI(api: BackendExpense): UIExpense {
  const dt = new Date(api.expenseDateTime);

  return {
    id: api.id,
    description: api.description,
    category: api.category,
    amount: api.amount,

    dateTime: api.expenseDateTime, // ✅ keep exact backend value

    date: dt.toISOString().split("T")[0],
    time: dt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),

    icon: getCategoryIcon(api.category),
    color: getCategoryColor(api.category),
    syncStatus: "synced",
  };
}

// utils/expenseUIUtils.ts
export function mapUIToBackendExpense(ui: UIExpense): Partial<BackendExpense> {
  return {
    description: ui.description,
    category: ui.category,
    amount: ui.amount,
    expenseDateTime: ui.dateTime,
  };
}
