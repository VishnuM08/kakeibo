import { Coffee } from "lucide-react";

export interface UIExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;

  // UI-only
  icon: typeof Coffee;
  color: string;
  time: string;

  // OPTIONAL UI DATA (from backend)
  notes?: string;
  receiptUrl?: string;
}
