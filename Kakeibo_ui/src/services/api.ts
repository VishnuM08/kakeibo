/**
 * API Service Layer for Spring Boot Backend Integration
 *
 * BACKEND INTEGRATION NOTES:
 * - Base URL should be configured via environment variable (e.g., VITE_API_BASE_URL)
 * - All requests should include JWT token in Authorization header
 * - Error handling should be centralized here
 * - Response types should match backend DTOs
 */

// ==================== TYPE DEFINITIONS ====================

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

// ✅ THIS IS THE FIX
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data; // { id, email, name }
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

import { LucideIcon } from "lucide-react";
import { BackendExpense } from "../types/BackendExpense";

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("jwt_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export interface CustomCategory {
  id: string;
  userId: string;
  value: string;
  label: string;
  icon: string; // Emoji or icon name
  color: string; // Hex color
  gradientFrom: string;
  gradientTo: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  monthlyAmount: number;
  month: string; // Format: "YYYY-MM"
  createdAt: string;
  updatedAt: string;
}

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

export interface RecurringExpense {
  id: string;
  userId: string;
  description: string;
  category: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string; // Optional end date
  lastGenerated?: string; // Last date when expense was auto-generated
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ==================== API CONFIGURATION ====================

// TODO: Move to environment variable
// For Vite projects, use import.meta.env instead of process.env

/*
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:8080/api";
*/

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Get JWT token from localStorage
 * BACKEND INTEGRATION: Token will be stored after successful login
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("jwt_token");
};

/**
 * Set JWT token in localStorage
 */
const setAuthToken = (token: string): void => {
  localStorage.setItem("jwt_token", token);
};

/**
 * Remove JWT token from localStorage (logout)
 */
const removeAuthToken = (): void => {
  localStorage.removeItem("jwt_token");
};

/**
 * Create headers with JWT token
 * BACKEND INTEGRATION: All authenticated requests should include this header
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Generic API request handler with error handling
 * BACKEND INTEGRATION: Handles JWT expiration and refresh token logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // TODO: Handle JWT token expiration (401) and refresh token flow
    if (response.status === 401) {
      // Token expired or invalid
      removeAuthToken();
      // Redirect to login or trigger refresh token flow
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

// ==================== AUTHENTICATION APIs ====================

/**
 * Login API
 * TODO: BACKEND INTEGRATION - POST /api/auth/login
 */

/*
export async function login(credentials: { email: string; password: string }): Promise<{ token: string; user: any }> {
  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: '1',
          name: credentials.email.split('@')[0],
          email: credentials.email,
        },
      });
    }, 500);
 
  });
  
  // TODO: BACKEND INTEGRATION - Replace with actual API call
  // const response = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(credentials)
  // });
  // if (!response.ok) throw new Error('Login failed');
  // return response.json();
}

*/

// services/api.ts
export async function login(credentials: { email: string; password: string }) {
  const response = await api.post("/auth/login", credentials);
  return response.data; // { token }
}

/**
 * Register API
 * TODO: BACKEND INTEGRATION - POST /api/auth/register
 */

/*
export async function register(userData: {
  email: string;
  password: string;
  name: string;
}): Promise<{ token: string; user: any }> {
  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: "mock_jwt_token_" + Date.now(),
        user: {
          id: "1",
          name: userData.name,
          email: userData.email,
        },
      });
    }, 500);
  });

  // TODO: BACKEND INTEGRATION - Replace with actual API call
  // const response = await fetch('/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(userData)
  // });
  // if (!response.ok) throw new Error('Registration failed');
  // return response.json();
}
*/
export async function register(userData: {
  email: string;
  password: string;
  name: string;
}) {
  const response = await api.post("/auth/register", userData);
  return response.data; // { token }
}

/**
 * Logout API
 * TODO: BACKEND INTEGRATION - POST /api/auth/logout
 */
export async function logout(): Promise<void> {
  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });

  // TODO: BACKEND INTEGRATION - Replace with actual API call
  // const token = localStorage.getItem('jwt_token');
  // await fetch('/api/auth/logout', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${token}`
  //   }
  // });
}

/**
 * POST /auth/refresh
 * Refresh JWT token using refresh token
 *
 * BACKEND ENDPOINT: POST /api/auth/refresh
 * REQUEST BODY: { refreshToken: string }
 * RESPONSE: { token: string, refreshToken: string }
 */
export async function refreshToken(
  refreshToken: string,
): Promise<AuthResponse> {
  // TODO: Implement refresh token flow
  console.log("[API] Refresh token request");

  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

// ==================== EXPENSE APIs ====================

/**
 * GET /expenses
 * Fetch all expenses for authenticated user
 *
 * BACKEND ENDPOINT: GET /api/expenses?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&category=food
 * RESPONSE: Expense[]
 */
/*
export async function getExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}): Promise<Expense[]> {
  // TODO: Replace with actual API call
  console.log("[API] Get expenses with filters:", filters);

  // Return mock data from localStorage for now
  //const stored = localStorage.getItem("kakeibo_expenses");
  //return stored ? JSON.parse(stored) : [];
  const response = await api.get("/expenses");
  return response.data;
  // Actual implementation:
  // const queryParams = new URLSearchParams(filters as any).toString();
  // return apiRequest<Expense[]>(`/expenses?${queryParams}`);
}

*/
export async function getExpenses(): Promise<BackendExpense[]> {
  const response = await api.get("/expenses");
  return response.data; // ✅ MUST RETURN
}

/**
 * POST /expenses
 * Create new expense
 *
 * BACKEND ENDPOINT: POST /api/expenses
 * REQUEST BODY: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
 * RESPONSE: Expense
 
*/

export async function createExpense(expense: {
  description: string;
  category: string;
  amount: number;
  expenseDateTime: string;
}) {
  const response = await api.post("/expenses", expense);
  console.log("[API] Create expense response:", response.data);
  return response.data;
}
/**
 * PUT /expenses/:id
 * Update existing expense
 *
 * BACKEND ENDPOINT: PUT /api/expenses/{id}
 * REQUEST BODY: Partial<Expense>
 * RESPONSE: Expense
 */
export async function updateExpense(
  id: string,
  updates: Partial<BackendExpense>,
): Promise<BackendExpense> {
  const response = await api.put(`/expenses/${id}`, updates);
  return response.data;
}

/**
 * DELETE /expenses/:id
 * Delete expense
 *
 * BACKEND ENDPOINT: DELETE /api/expenses/{id}
 * RESPONSE: { success: boolean, message: string }
 */
export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

/**
 * POST /expenses/upload-receipt
 * Upload receipt image
 *
 * BACKEND ENDPOINT: POST /api/expenses/upload-receipt
 * REQUEST BODY: FormData with file
 * RESPONSE: { url: string }
 */
export async function uploadReceipt(file: File): Promise<string> {
  // TODO: Replace with actual API call
  console.log("[API] Upload receipt:", file.name);

  const formData = new FormData();
  formData.append("receipt", file);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/expenses/upload-receipt`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const data = await response.json();
  return data.url;
}

// ==================== RECURRING EXPENSE APIs ====================

/**
 * GET /recurring-expenses
 * Fetch all recurring expenses for authenticated user
 *
 * BACKEND ENDPOINT: GET /api/recurring-expenses
 * RESPONSE: RecurringExpense[]
 */
export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  // TODO: Replace with actual API call
  console.log("[API] Get recurring expenses");

  const stored = localStorage.getItem("kakeibo_recurring_expenses");
  return stored ? JSON.parse(stored) : [];

  // Actual implementation:
  // return apiRequest<RecurringExpense[]>('/recurring-expenses');
}

/**
 * POST /recurring-expenses
 * Create new recurring expense
 *
 * BACKEND ENDPOINT: POST /api/recurring-expenses
 * REQUEST BODY: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
 * RESPONSE: RecurringExpense
 */
export async function createRecurringExpense(
  expense: Omit<RecurringExpense, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<RecurringExpense> {
  // TODO: Replace with actual API call
  console.log("[API] Create recurring expense:", expense);

  return apiRequest<RecurringExpense>("/recurring-expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

/**
 * PUT /recurring-expenses/:id
 * Update recurring expense
 *
 * BACKEND ENDPOINT: PUT /api/recurring-expenses/{id}
 * REQUEST BODY: Partial<RecurringExpense>
 * RESPONSE: RecurringExpense
 */
export async function updateRecurringExpense(
  id: string,
  updates: Partial<RecurringExpense>,
): Promise<RecurringExpense> {
  // TODO: Replace with actual API call
  console.log("[API] Update recurring expense:", id, updates);

  return apiRequest<RecurringExpense>(`/recurring-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * DELETE /recurring-expenses/:id
 * Delete recurring expense
 *
 * BACKEND ENDPOINT: DELETE /api/recurring-expenses/{id}
 */
export async function deleteRecurringExpense(id: string): Promise<void> {
  // TODO: Replace with actual API call
  console.log("[API] Delete recurring expense:", id);

  return apiRequest<void>(`/recurring-expenses/${id}`, {
    method: "DELETE",
  });
}

// ==================== BUDGET APIs ====================

/**
 * GET /budgets/current
 * Get budget for current month
 *
 * BACKEND ENDPOINT: GET /api/budgets/current
 * RESPONSE: Budget | null
 */
export async function getCurrentBudget(): Promise<Budget | null> {
  // TODO: Replace with actual API call
  console.log("[API] Get current budget");

  const stored = localStorage.getItem("kakeibo_monthly_budget");
  if (!stored) return null;

  return {
    id: "budget-1",
    userId: "user-1",
    monthlyAmount: parseFloat(stored),
    month: new Date().toISOString().slice(0, 7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Actual implementation:
  // return apiRequest<Budget>('/budgets/current');
}

/**
 * POST /budgets
 * Set or update budget
 *
 * BACKEND ENDPOINT: POST /api/budgets
 * REQUEST BODY: { monthlyAmount: number, month: string }
 * RESPONSE: Budget
 */
export async function setBudget(
  amount: number,
  month: string,
): Promise<Budget> {
  // TODO: Replace with actual API call
  console.log("[API] Set budget:", amount, month);

  return apiRequest<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify({ monthlyAmount: amount, month }),
  });
}

// ==================== SAVINGS GOAL APIs ====================

/**
 * GET /savings-goals
 * Fetch all savings goals
 *
 * BACKEND ENDPOINT: GET /api/savings-goals
 * RESPONSE: SavingsGoal[]
 */
export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  // TODO: Replace with actual API call
  console.log("[API] Get savings goals");

  const stored = localStorage.getItem("kakeibo_savings_goals");
  return stored ? JSON.parse(stored) : [];

  // Actual implementation:
  // return apiRequest<SavingsGoal[]>('/savings-goals');
}

/**
 * POST /savings-goals
 * Create new savings goal
 *
 * BACKEND ENDPOINT: POST /api/savings-goals
 * REQUEST BODY: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
 * RESPONSE: SavingsGoal
 */
export async function createSavingsGoal(
  goal: Omit<SavingsGoal, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<SavingsGoal> {
  // TODO: Replace with actual API call
  console.log("[API] Create savings goal:", goal);

  return apiRequest<SavingsGoal>("/savings-goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

/**
 * PUT /savings-goals/:id
 * Update savings goal (e.g., add to currentAmount)
 *
 * BACKEND ENDPOINT: PUT /api/savings-goals/{id}
 * REQUEST BODY: Partial<SavingsGoal>
 * RESPONSE: SavingsGoal
 */
export async function updateSavingsGoal(
  id: string,
  updates: Partial<SavingsGoal>,
): Promise<SavingsGoal> {
  // TODO: Replace with actual API call
  console.log("[API] Update savings goal:", id, updates);

  return apiRequest<SavingsGoal>(`/savings-goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * DELETE /savings-goals/:id
 * Delete savings goal
 *
 * BACKEND ENDPOINT: DELETE /api/savings-goals/{id}
 */
export async function deleteSavingsGoal(id: string): Promise<void> {
  // TODO: Replace with actual API call
  console.log("[API] Delete savings goal:", id);

  return apiRequest<void>(`/savings-goals/${id}`, {
    method: "DELETE",
  });
}

// ==================== CUSTOM CATEGORY APIs ====================

/**
 * GET /categories
 * Fetch all custom categories for user
 *
 * BACKEND ENDPOINT: GET /api/categories
 * RESPONSE: CustomCategory[]
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
  // TODO: Replace with actual API call
  console.log("[API] Get custom categories");

  const stored = localStorage.getItem("kakeibo_custom_categories");
  return stored ? JSON.parse(stored) : [];

  // Actual implementation:
  // return apiRequest<CustomCategory[]>('/categories');
}

/**
 * POST /categories
 * Create new custom category
 *
 * BACKEND ENDPOINT: POST /api/categories
 * REQUEST BODY: Omit<CustomCategory, 'id' | 'userId' | 'createdAt'>
 * RESPONSE: CustomCategory
 */
export async function createCustomCategory(
  category: Omit<CustomCategory, "id" | "userId" | "createdAt">,
): Promise<CustomCategory> {
  // TODO: Replace with actual API call
  console.log("[API] Create custom category:", category);

  return apiRequest<CustomCategory>("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

/**
 * PUT /categories/:id
 * Update custom category
 *
 * BACKEND ENDPOINT: PUT /api/categories/{id}
 * REQUEST BODY: Partial<CustomCategory>
 * RESPONSE: CustomCategory
 */
export async function updateCustomCategory(
  id: string,
  updates: Partial<CustomCategory>,
): Promise<CustomCategory> {
  // TODO: Replace with actual API call
  console.log("[API] Update custom category:", id, updates);

  return apiRequest<CustomCategory>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * DELETE /categories/:id
 * Delete custom category
 *
 * BACKEND ENDPOINT: DELETE /api/categories/{id}
 */
export async function deleteCustomCategory(id: string): Promise<void> {
  // TODO: Replace with actual API call
  console.log("[API] Delete custom category:", id);

  return apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// ==================== EXPORT APIs ====================

/**
 * GET /expenses/export
 * Export expenses as CSV
 *
 * BACKEND ENDPOINT: GET /api/expenses/export?format=csv&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * RESPONSE: Blob (CSV file)
 */
export async function exportExpenses(
  format: "csv" | "pdf",
  filters?: {
    startDate?: string;
    endDate?: string;
  },
): Promise<Blob> {
  // TODO: Replace with actual API call that returns file blob
  console.log("[API] Export expenses:", format, filters);

  const token = getAuthToken();
  const queryParams = new URLSearchParams({
    format,
    ...(filters as any),
  }).toString();

  const response = await fetch(
    `${API_BASE_URL}/expenses/export?${queryParams}`,
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );

  return await response.blob();
}

// ==================== USER PROFILE APIs ====================

/**
 * GET /user/profile
 * Get user profile information
 *
 * BACKEND ENDPOINT: GET /api/user/profile
 * RESPONSE: User
 */
export async function getUserProfile(): Promise<User> {
  // TODO: Replace with actual API call
  console.log("[API] Get user profile");

  return apiRequest<User>("/user/profile");
}

/**
 * PUT /user/profile
 * Update user profile
 *
 * BACKEND ENDPOINT: PUT /api/user/profile
 * REQUEST BODY: Partial<User>
 * RESPONSE: User
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  // TODO: Replace with actual API call
  console.log("[API] Update user profile:", updates);

  return apiRequest<User>("/user/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * POST /user/pin
 * Set or update PIN for biometric lock
 *
 * BACKEND ENDPOINT: POST /api/user/pin
 * REQUEST BODY: { pin: string }
 * RESPONSE: { success: boolean }
 */
export async function setUserPin(pin: string): Promise<void> {
  // TODO: Replace with actual API call
  console.log("[API] Set user PIN");

  // For now, store encrypted PIN in localStorage
  // In production, this should be handled securely on backend
  const hashedPin = btoa(pin); // Simple encoding, use proper hashing in backend
  localStorage.setItem("kakeibo_user_pin", hashedPin);

  // Actual implementation:
  // return apiRequest<void>('/user/pin', {
  //   method: 'POST',
  //   body: JSON.stringify({ pin }),
  // });
}

/**
 * POST /user/verify-pin
 * Verify user PIN
 *
 * BACKEND ENDPOINT: POST /api/user/verify-pin
 * REQUEST BODY: { pin: string }
 * RESPONSE: { valid: boolean }
 */
export async function verifyUserPin(pin: string): Promise<boolean> {
  // TODO: Replace with actual API call
  console.log("[API] Verify user PIN");

  const stored = localStorage.getItem("kakeibo_user_pin");
  if (!stored) return false;

  return btoa(pin) === stored;

  // Actual implementation:
  // const result = await apiRequest<{ valid: boolean }>('/user/verify-pin', {
  //   method: 'POST',
  //   body: JSON.stringify({ pin }),
  // });
  // return result.valid;
}

// Export utility functions
export { getAuthToken, setAuthToken, removeAuthToken };
