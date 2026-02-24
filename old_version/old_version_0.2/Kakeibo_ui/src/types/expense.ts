import { LucideIcon } from "lucide-react";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface UIExpense extends Expense {
  time: string;
  icon: LucideIcon;
  color: string;
}
