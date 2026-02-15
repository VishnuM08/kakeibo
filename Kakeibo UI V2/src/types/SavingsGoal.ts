export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSavingsGoal {
  id: string;
  goalName: string;
  amount: number;
  remainingAmount: number;
  date: string; // "YYYY-MM-DD"
  user: {
    id: string;
    name: string;
    email: string;
    // ... other user fields
  };
  createdAt: string;
  updatedAt: string;
}
