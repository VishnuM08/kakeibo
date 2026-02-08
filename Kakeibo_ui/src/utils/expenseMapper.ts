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

/* ------------------ ICONS ------------------ */

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

/* ------------------ BACKEND → UI ------------------ */

export function mapApiExpenseToUI(exp: BackendExpense): UIExpense {
  const dateObj = new Date(exp.expenseDateTime);

  return {
    id: exp.id,
    description: exp.description,
    category: exp.category,
    amount: exp.amount,

    // ✅ SOURCE OF TRUTH
    dateTime: exp.expenseDateTime,

    // 👇 DISPLAY ONLY
    date: dateObj.toISOString().split("T")[0],
    time: dateObj.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),

    icon: getCategoryIcon(exp.category),
    color: getCategoryColor(exp.category),
    syncStatus: "synced",
  };
}

/* ------------------ UI → BACKEND ------------------ */

export function mapUIToBackendExpense(ui: UIExpense) {
  return {
    description: ui.description,
    category: ui.category,
    amount: ui.amount,

    // ✅ ALWAYS send ISO UTC
    expenseDateTime: ui.dateTime,
  };
}
