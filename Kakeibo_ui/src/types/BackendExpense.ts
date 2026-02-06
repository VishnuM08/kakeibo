export interface BackendExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  isRecurring: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
