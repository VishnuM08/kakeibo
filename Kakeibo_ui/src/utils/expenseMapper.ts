import { BackendExpense } from "../types/BackendExpense";
import { UIExpense } from "../types/UIExpense";
import {
  Coffee,
  Utensils,
  Train,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
} from "lucide-react";

export function getCategoryIcon(category: string) {
  const icons: Record<string, typeof Coffee> = {
    food: Utensils,
    transport: Train,
    coffee: Coffee,
    shopping: ShoppingBag,
    entertainment: Film,
    utilities: Zap,
  };

  return icons[category.toLowerCase()] || MoreHorizontal;
}

export function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    food: "from-[#ff6b6b] to-[#ee5a6f]",
    transport: "from-[#4ecdc4] to-[#44a08d]",
    coffee: "from-[#f7b731] to-[#fa8231]",
    shopping: "from-[#a29bfe] to-[#6c5ce7]",
    entertainment: "from-[#fd79a8] to-[#e84393]",
    utilities: "from-[#00b894] to-[#00cec9]",
  };

  return colors[category.toLowerCase()] || "from-[#b2bec3] to-[#636e72]";
}

export function mapApiExpenseToUI(exp: BackendExpense): UIExpense {
  return {
    id: exp.id,
    description: exp.description,
    category: exp.category,
    amount: exp.amount,
    date: exp.date,

    icon: getCategoryIcon(exp.category),
    color: getCategoryColor(exp.category),
    time: new Date(exp.date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export function mapUIToBackendExpense(
  ui: UIExpense,
  userId: string,
): BackendExpense {
  const now = new Date().toISOString();

  return {
    id: ui.id,
    description: ui.description,
    category: ui.category,
    amount: ui.amount,
    date: ui.date,
    userId,

    // 🔽 REQUIRED backend fields
    isRecurring: false,
    createdAt: now,
    updatedAt: now,
  };
}
