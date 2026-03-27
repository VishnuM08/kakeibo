import React from "react";
import { motion } from "motion/react";
import { Repeat, ChevronRight, AlertCircle } from "lucide-react";
import { RecurringExpense } from "../services/api";
import { calculateNextOccurrence, isDue as checkIsDue } from "../utils/recurringUtils";

interface RecurringExpensesWidgetProps {
  onOpenRecurring: () => void;
  isDarkMode: boolean;
}

export function RecurringExpensesWidget({
  onOpenRecurring,
  isDarkMode,
}: RecurringExpensesWidgetProps) {
  // Read from localStorage (synced by RecurringExpensesView)
  const expenses: RecurringExpense[] = JSON.parse(
    localStorage.getItem("kakeibo_recurring_expenses") || "[]",
  );

  // Map to include nextOccurrence for each and filter active
  const activeExpenses = expenses
    .map((exp) => ({
      ...exp,
      nextOccurrence: calculateNextOccurrence(
        exp.startDate,
        exp.frequency,
        exp.lastGenerated,
      ),
    }))
    .filter((exp) => exp.isActive);

  // Check which ones are due
  const dueExpenses = activeExpenses.filter((exp) =>
    checkIsDue(exp.nextOccurrence),
  );

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpenRecurring}
      className={`relative overflow-hidden rounded-3xl p-5 cursor-pointer border transition-all ${
        isDarkMode
          ? "bg-[#1c1c1e] border-white/10 hover:bg-white/[0.07]"
          : "bg-white border-black/5 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isDarkMode ? "bg-blue-500/20" : "bg-blue-50"
          }`}
        >
          <Repeat
            className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
          />
        </div>
        <ChevronRight
          className={`w-5 h-5 opacity-30 ${isDarkMode ? "text-white" : "text-black"}`}
        />
      </div>

      <div className="space-y-1">
        <h3
          className={`text-[17px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
        >
          Recurring
        </h3>
        <p
          className={`text-[13px] font-medium ${isDarkMode ? "text-white/40" : "text-black/40"}`}
        >
          {activeExpenses.length} active bills
        </p>
      </div>

      {dueExpenses.length > 0 ? (
        <div
          className={`mt-4 pt-3 border-t flex items-center gap-2 ${
            isDarkMode ? "border-white/5" : "border-black/5"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-[12px] font-semibold text-orange-500">
            {dueExpenses.length} payment{dueExpenses.length > 1 ? "s" : ""} due
          </p>
        </div>
      ) : activeExpenses.length > 0 ? (
        <div
          className={`mt-4 pt-3 border-t flex items-center gap-2 ${
            isDarkMode ? "border-white/5" : "border-black/5"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <p
            className={`text-[12px] font-medium ${isDarkMode ? "text-white/40" : "text-black/40"}`}
          >
            All caught up
          </p>
        </div>
      ) : (
        <div
          className={`mt-4 pt-3 border-t flex items-center gap-2 ${
            isDarkMode ? "border-white/5" : "border-black/5"
          }`}
        >
          <AlertCircle
            className={`w-3.5 h-3.5 ${isDarkMode ? "text-white/20" : "text-black/20"}`}
          />
          <p
            className={`text-[12px] font-medium ${isDarkMode ? "text-white/20" : "text-black/20"}`}
          >
            No recurring bills
          </p>
        </div>
      )}
    </motion.div>
  );
}
