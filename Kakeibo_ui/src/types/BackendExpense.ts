import { LucideIcon } from "lucide-react";

export interface BackendExpense {
  // id: string;
  // description: string;
  // category: string;
  // amount: number;
  // expenseDateTime: string;
  // notes?: string; // Optional expense notes
  // receiptUrl?: string; // URL to receipt image stored in backend
  // isRecurring: boolean;
  // recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  userId: string; // Foreign key to user
  // createdAt: string;
  // updatedAt: string;

  id: string;
  description: string;
  category: string;
  amount: number;

  dateTime: string; // ✅ SOURCE OF TRUTH (ISO)

  // derived (UI only)
  date: string; // YYYY-MM-DD
  time: string; // 10:30 AM

  icon: LucideIcon;
  color: string;

  syncStatus?: "synced" | "pending" | "failed";
  notes?: string; // Optional expense notes
  receiptUrl?: string; // URL to receipt image stored in backend
}
