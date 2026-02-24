import { Coffee } from "lucide-react";

export interface UIExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;

  // UI-only fields
  icon: typeof Coffee;
  color: string;
  time: string;
}
