import {
  Coffee,
  Film,
  MoreHorizontal,
  ShoppingBag,
  Train,
  Utensils,
  Zap,
} from "lucide-react";
import { BackendExpense } from "../types/BackendExpense";
import { UIExpense } from "../types/UIExpense";

export function exportToCSV(
  expenses: UIExpense[],
  filename: string = "expenses.csv",
): void {
  // CSV Headers
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount (₹)",
    "Notes",
    "Receipt",
    "Is Recurring",
  ];

  // Convert expenses to CSV rows
  const rows = expenses.map((expense) => [
    new Date(expense.date).toLocaleDateString("en-IN"),
    `"${expense.description}"`, // Wrap in quotes to handle commas
    expense.category,
    expense.amount.toFixed(2),
    expense.notes ? `"${expense.notes}"` : "",
    expense.receiptUrl || "",
    expense.isRecurring ? "Yes" : "No",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export expenses as JSON format
 * Useful for backup and data migration
 *
 * TODO: BACKEND INTEGRATION
 * - Backend endpoint: GET /api/expenses/export?format=json
 */
export function exportToJSON(
  expenses: UIExpense[],
  filename: string = "expenses.json",
): void {
  const jsonContent = JSON.stringify(expenses, null, 2);

  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate expense report summary
 *
 * TODO: BACKEND INTEGRATION
 * - Backend can generate more detailed PDF reports with charts
 * - Use libraries like iText (Java) or Apache PDFBox on backend
 */

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

export function generateExpenseReport(expenses: UIExpense[]): {
  total: number;
  count: number;
  byCategory: Record<string, { total: number; count: number }>;
  byMonth: Record<string, { total: number; count: number }>;
  average: number;
} {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  // Group by category
  const byCategory: Record<string, { total: number; count: number }> = {};
  expenses.forEach((exp) => {
    if (!byCategory[exp.category]) {
      byCategory[exp.category] = { total: 0, count: 0 };
    }
    byCategory[exp.category].total += exp.amount;
    byCategory[exp.category].count += 1;
  });

  // Group by month
  const byMonth: Record<string, { total: number; count: number }> = {};
  expenses.forEach((exp) => {
    const month = new Date(exp.date).toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[month]) {
      byMonth[month] = { total: 0, count: 0 };
    }
    byMonth[month].total += exp.amount;
    byMonth[month].count += 1;
  });

  return {
    total,
    count,
    byCategory,
    byMonth,
    average,
  };
}

/**
 * Filter expenses by date range
 * Used before exporting
 */
export function filterExpensesByDateRange(
  expenses: UIExpense[],
  startDate: string,
  endDate: string,
): UIExpense[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return expenses.filter((expense) => {
    const expDate = new Date(expense.date);
    return expDate >= start && expDate <= end;
  });
}

/**
 * Get current month date range
 * Helper for default export range
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  return { startDate, endDate };
}
