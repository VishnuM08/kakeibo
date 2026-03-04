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
import logoUrl from "../components/Images/logo-app.png";

export async function exportToCSV(
  expenses: UIExpense[],
  filename: string = "kakeibo-expenses",
): Promise<void> {
  // ── Fetch logo as base64 ──────────────────────────────────────────────────
  let logoDataUrl = "";
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    // fallback: use emoji if logo fails to load
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const avg = expenses.length ? total / expenses.length : 0;

  // Category breakdown
  const byCategory: Record<string, { count: number; total: number }> = {};
  expenses.forEach((e) => {
    const k = e.category.charAt(0).toUpperCase() + e.category.slice(1);
    if (!byCategory[k]) byCategory[k] = { count: 0, total: 0 };
    byCategory[k].count++;
    byCategory[k].total += e.amount;
  });

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // ── Build HTML ─────────────────────────────────────────────────────────────
  const rows = sorted
    .map(
      (e, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9f9fb"}">
        <td>${new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td style="font-weight:500">${e.description}</td>
        <td><span class="badge">${e.category.charAt(0).toUpperCase() + e.category.slice(1)}</span></td>
        <td style="text-align:right;font-weight:600;color:#d4183d">₹${e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="color:#86868b">${e.notes || "—"}</td>
        <td style="text-align:center">${e.isRecurring ? "🔁" : "—"}</td>
      </tr>`,
    )
    .join("");

  const catRows = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([cat, { count, total: t }]) => `
      <tr>
        <td>${cat}</td>
        <td style="text-align:center">${count}</td>
        <td style="text-align:right;font-weight:600">₹${t.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right;color:#86868b">${((t / total) * 100).toFixed(1)}%</td>
      </tr>`,
    )
    .join("");

  const exportDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Kakeibo — Expense Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, "Inter", BlinkMacSystemFont, sans-serif; background: #f5f5f7; color: #1a1a1a; padding: 40px 32px; }
    .page { max-width: 860px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .logo { width: 48px; height: 48px; border-radius: 12px; object-fit: contain; }
    h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
    .subtitle { font-size: 13px; color: #86868b; margin-bottom: 28px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 16px; padding: 18px 20px; }
    .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #86868b; margin-bottom: 6px; }
    .stat-value { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #86868b; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 16px; overflow: hidden; margin-bottom: 28px; font-size: 14px; }
    thead tr { background: #f5f5f7; }
    th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #86868b; border-bottom: 1px solid rgba(0,0,0,.07); }
    td { padding: 11px 14px; border-bottom: 1px solid rgba(0,0,0,.04); font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .badge { background: #f0f0f5; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .footer { text-align: center; font-size: 11px; color: #c7c7cc; margin-top: 16px; }
    @media print { body { background: #fff; padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${
        logoDataUrl
          ? `<img src="${logoDataUrl}" class="logo" alt="Kakeibo Logo" />`
          : `<div style="width:48px;height:48px;background:#007aff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px">🌿</div>`
      }
      <h1>Kakeibo</h1>
    </div>
    <p class="subtitle">Expense Report · Exported on ${exportDate} · ${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}</p>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total Spent</div>
        <div class="stat-value">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Transactions</div>
        <div class="stat-value">${expenses.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg per Entry</div>
        <div class="stat-value">₹${avg.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
      </div>
    </div>

    <div class="section-title">All Transactions</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th style="text-align:right">Amount</th>
          <th>Notes</th>
          <th style="text-align:center">Recurring</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="section-title">Spending by Category</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th style="text-align:center">Count</th>
          <th style="text-align:right">Total</th>
          <th style="text-align:right">Share</th>
        </tr>
      </thead>
      <tbody>${catRows}</tbody>
    </table>

    <div class="footer">家計簿 · Designed &amp; Engineered by Lavish</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.html`;
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
