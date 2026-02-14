export interface BackendExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDateTime: string;
  notes?: string; // Optional expense notes
  receiptUrl?: string; // URL to receipt image stored in backend
  isRecurring: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  userId: string; // Foreign key to user
  createdAt: string;
  updatedAt: string;
}
