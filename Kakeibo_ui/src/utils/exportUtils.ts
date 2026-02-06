/**
 * Export Utilities for Expense Reports
 * Client-side only (UIExpense based)
 */

import { UIExpense } from "../types/UIExpense";

/**
 * Export expenses as CSV format
 */
export function exportToCSV(
  expenses: UIExpense[],
  filename: string = "expenses.csv",
): void {
  const headers = ["Date", "Description", "Category", "Amount (₹)"];

  const rows = expenses.map((expense) => [
    new Date(expense.date).toLocaleDateString("en-IN"),
    `"${expense.description}"`,
    expense.category,
    expense.amount.toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export expenses as JSON (UI backup)
 */
export function exportToJSON(
  expenses: UIExpense[],
  filename: string = "expenses.json",
): void {
  const blob = new Blob([JSON.stringify(expenses, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get current month date range
 */
export function getCurrentMonthRange(): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();

  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  return { startDate, endDate };
}
