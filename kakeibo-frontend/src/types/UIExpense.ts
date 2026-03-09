import { LucideIcon } from "lucide-react";

export interface UIExpense {
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
  isRecurring?: boolean;
}
