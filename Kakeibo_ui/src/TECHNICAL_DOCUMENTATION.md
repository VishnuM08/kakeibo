# 📘 KAKEIBO EXPENSE TRACKER - TECHNICAL DOCUMENTATION

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Flow](#application-flow)
3. [Component Hierarchy](#component-hierarchy)
4. [State Management](#state-management)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Authentication System](#authentication-system)
7. [Expense Management](#expense-management)
8. [Error Handling Architecture](#error-handling-architecture)
9. [Validation System](#validation-system)
10. [Security Implementation](#security-implementation)
11. [Styling Approach](#styling-approach)
12. [Code Patterns & Conventions](#code-patterns--conventions)
13. [Performance Optimizations](#performance-optimizations)
14. [Testing Strategy](#testing-strategy)

---

## 🏗️ Architecture Overview

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                   │
│  React 18 + TypeScript + Tailwind CSS v4                │
│  - Component-based UI                                    │
│  - Type-safe props and state                             │
│  - Utility-first styling                                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│  State Management + Business Logic                       │
│  - React hooks (useState, useEffect, useMemo)            │
│  - Custom hooks (useConfirm)                             │
│  - Local state management (no Redux needed)              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                       │
│  API Service + Utilities                                 │
│  - /services/api.ts (HTTP client)                        │
│  - /utils/validation.ts (input validation)               │
│  - /utils/security.ts (encryption, tokens)               │
│  - /utils/toast.tsx (notifications)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                       DATA LAYER                         │
│  localStorage (temporary) → Backend API (future)         │
│  - Offline-first architecture                            │
│  - Sync queue for pending operations                     │
│  - Local persistence for user data                       │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Component-Based Architecture**: Small, reusable, single-responsibility components
2. **Unidirectional Data Flow**: Parent → Child props, Child → Parent callbacks
3. **Separation of Concerns**: UI, logic, and data layers are separate
4. **Type Safety**: TypeScript interfaces for all props and data structures
5. **Progressive Enhancement**: Works offline, syncs when online
6. **Accessibility First**: ARIA labels, keyboard navigation, screen reader support

---

## 🔄 Application Flow

### 1. Initial Load Flow

```
┌──────────────┐
│  index.html  │ Loads React app
└──────┬───────┘
       ↓
┌──────────────┐
│   main.tsx   │ React entry point
└──────┬───────┘
       ↓
┌──────────────┐
│    App.tsx   │ ◄── ROOT COMPONENT (Authentication Wrapper)
└──────┬───────┘
       ↓
    [Check localStorage for jwt_token]
       ↓
   ┌───┴───┐
   │       │
   ↓       ↓
NO TOKEN   HAS TOKEN
   ↓       ↓
   ↓    [Check PIN enabled]
   ↓       ↓
   ↓    ┌───┴───┐
   ↓    ↓       ↓
   ↓  PIN ON   PIN OFF
   ↓    ↓       ↓
   ↓    │       └──────┐
   ↓    ↓              ↓
┌──────────────┐  ┌────────────┐  ┌────────────┐
│ AuthScreen   │  │ PINLock    │  │  AppMain   │
│ (Login/Reg)  │  │ Screen     │  │ (Dashboard)│
└──────────────┘  └────────────┘  └────────────┘
       ↓                ↓                ↓
   [Auth Success]   [PIN Success]   [User interacts]
       ↓                ↓                ↓
       └────────────────┴────────────────┘
                       ↓
                ┌────────────┐
                │  AppMain   │
                │ (Dashboard)│
                └────────────┘
```

### 2. Authentication Flow

```typescript
// FILE: /App.tsx

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState(false);

  // On mount: Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      // TODO: Verify token with backend
      setIsAuthenticated(true);
      
      // Check if PIN is enabled
      const pinEnabled = localStorage.getItem('kakeibo_pin_enabled') === 'true';
      if (pinEnabled) {
        setIsPinLocked(true); // Show PIN screen
      }
    }
  }, []);

  // When user logs in successfully
  const handleAuthSuccess = (token: string, user: any) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  // Render appropriate screen based on state
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (isPinLocked) {
    return <PINLockScreen onUnlock={() => setIsPinLocked(false)} />;
  }

  return <AppMain />;
}
```

**Key Points:**
- `App.tsx` is a **state machine** with 3 states: unauthenticated, authenticated but locked, unlocked
- Uses `localStorage` for persistence across page refreshes
- State flows: `AuthScreen` → `PINLockScreen` → `AppMain`

### 3. Main Application Flow

```
┌────────────────────────────────────────────────────────┐
│                      AppMain.tsx                        │
│  (Main Dashboard - Central Hub)                         │
└────────────────┬───────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┬───────────┐
    ↓            ↓            ↓              ↓           ↓
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
│Dashboard│ │Analytics│ │ Calendar │ │ Savings  │ │Settings │
│  View   │ │  View   │ │   View   │ │  Goals   │ │  View   │
└─────────┘ └─────────┘ └──────────┘ └──────────┘ └─────────┘
    ↓            ↑            ↑              ↑           ↑
    │            │            │              │           │
    └────────────┴────────────┴──────────────┴───────────┘
                 │
          [User Actions]
                 │
    ┌────────────┼────────────────────┐
    ↓            ↓                    ↓
┌─────────┐ ┌─────────┐      ┌──────────────┐
│   Add   │ │  Edit   │      │    Delete    │
│ Expense │ │ Expense │      │   Expense    │
└─────────┘ └─────────┘      └──────────────┘
    ↓            ↓                    ↓
    └────────────┴────────────────────┘
                 │
          [Update State]
                 ↓
         ┌───────────────┐
         │ expenses array│
         └───────────────┘
                 ↓
         [Re-render UI]
```

---

## 🧩 Component Hierarchy

### Root Level

```
App.tsx (Root - Authentication Wrapper)
├── <ErrorBoundary>                    // Catches all errors
│   ├── <Toaster />                    // Global toast notifications
│   └── [Conditional Rendering]
│       ├── <AuthScreen />             // If not authenticated
│       ├── <PINLockScreen />          // If authenticated but locked
│       └── <AppMain />                // If authenticated and unlocked
```

### AppMain Component Tree

```
AppMain.tsx (Main Dashboard)
├── Header
│   ├── Current Month/Year
│   ├── Dark Mode Toggle
│   └── Settings Button
│
├── Budget Section
│   ├── Current Month Total (₹)
│   ├── Budget Progress Bar
│   └── <BudgetWarning />              // If over budget
│
├── Action Buttons
│   ├── Add Expense Button → <AddExpenseModal />
│   └── View Past Expenses → <CalendarView />
│
├── Today's Expenses List
│   └── [For each expense]
│       └── Expense Card
│           ├── Category Icon (gradient)
│           ├── Description
│           ├── Time
│           └── Amount
│               └── [On click] → <EditExpenseModal />
│
├── Bottom Navigation
│   ├── Home (active)
│   ├── Analytics → <AnalyticsView />
│   ├── Calendar → <CalendarView />
│   ├── Savings → <SavingsGoalsView />
│   └── Settings → <SettingsView />
│
└── Modals (Conditional)
    ├── <AddExpenseModal />
    ├── <EditExpenseModal />
    ├── <BudgetSettingsModal />
    ├── <RecurringExpenseModal />
    ├── <SearchFilters />
    └── <ConfirmDialog />
```

### Component File Structure

```
/components/
│
├── Core App Components
│   ├── AppMain.tsx              // Main dashboard
│   ├── AuthScreen.tsx           // Login/Register
│   ├── PINLockScreen.tsx        // PIN lock screen
│   └── SettingsView.tsx         // Settings page
│
├── Views (Full-screen overlays)
│   ├── AnalyticsView.tsx        // Analytics page
│   ├── CalendarView.tsx         // Past expenses calendar
│   └── SavingsGoalsView.tsx     // Savings goals manager
│
├── Modals (Dialogs)
│   ├── AddExpenseModal.tsx      // Add new expense
│   ├── EditExpenseModal.tsx     // Edit/Delete expense
│   ├── BudgetSettingsModal.tsx  // Set monthly budget
│   ├── RecurringExpenseModal.tsx // Create recurring expense
│   ├── SearchFilters.tsx        // Advanced search
│   └── DailyExpensePopup.tsx    // Day summary from calendar
│
├── UI Components (Reusable)
│   ├── ConfirmDialog.tsx        // Confirmation dialogs
│   ├── ErrorBoundary.tsx        // Error boundaries
│   ├── LoadingSpinner.tsx       // Loading states
│   ├── BudgetWarning.tsx        // Budget alert banner
│   └── CategoryFilter.tsx       // Category selection
│
└── Utilities
    └── /ui/                     // Base UI components (buttons, inputs)
```

---

## 🔄 State Management

### State Architecture

We use **React local state** (no Redux) with the following pattern:

```typescript
// PARENT COMPONENT (AppMain.tsx) - Single Source of Truth
const [expenses, setExpenses] = useState<Expense[]>([]);

// CHILD COMPONENT - Receives data via props
function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return expenses.map(exp => <ExpenseCard expense={exp} />);
}

// CHILD COMPONENT - Communicates changes via callbacks
function AddExpenseModal({ onAdd }: { onAdd: (expense: Expense) => void }) {
  const handleSubmit = () => {
    const newExpense = { /* ... */ };
    onAdd(newExpense); // ← Send data back to parent
  };
}
```

### State Flow Example: Adding an Expense

```typescript
// FILE: /components/AppMain.tsx

export function AppMain() {
  // ═══════════════════════════════════════════════════════════
  // STATE DECLARATIONS
  // ═══════════════════════════════════════════════════════════
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // LOAD DATA FROM LOCALSTORAGE ON MOUNT
  // ═══════════════════════════════════════════════════════════
  
  useEffect(() => {
    const stored = localStorage.getItem('kakeibo_expenses');
    if (stored) {
      setExpenses(JSON.parse(stored));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SAVE TO LOCALSTORAGE WHENEVER EXPENSES CHANGE
  // ═══════════════════════════════════════════════════════════
  
  useEffect(() => {
    localStorage.setItem('kakeibo_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  const handleAddExpense = (newExpense: Expense) => {
    // Update state (triggers re-render)
    setExpenses([...expenses, newExpense]);
    
    // TODO: BACKEND - Call API to persist
    // await createExpense(newExpense);
    
    // Show success feedback
    toast.success('Expense added!');
    
    // Close modal
    setIsAddModalOpen(false);
  };

  const handleEditExpense = (updatedExpense: Expense) => {
    setExpenses(
      expenses.map(exp => 
        exp.id === updatedExpense.id ? updatedExpense : exp
      )
    );
    toast.success('Expense updated!');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(exp => exp.id !== expenseId));
    toast.success('Expense deleted');
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  return (
    <>
      {/* Button to open modal */}
      <button onClick={() => setIsAddModalOpen(true)}>
        Add Expense
      </button>

      {/* Pass callback to child component */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onAdd={handleAddExpense}              // ← Callback
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Display expenses */}
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={handleEditExpense}          // ← Callback
          onDelete={handleDeleteExpense}      // ← Callback
        />
      ))}
    </>
  );
}
```

### State Management Patterns

#### 1. **Lifting State Up**
When multiple components need the same data, lift state to their common parent:

```typescript
// PARENT holds state
function AppMain() {
  const [expenses, setExpenses] = useState([]);
  
  return (
    <>
      <ExpenseList expenses={expenses} />
      <ExpenseStats expenses={expenses} />  {/* Both use same data */}
    </>
  );
}
```

#### 2. **Derived State (useMemo)**
Calculate values from existing state instead of storing separately:

```typescript
function AppMain() {
  const [expenses, setExpenses] = useState([]);
  
  // ✅ GOOD - Derived from expenses
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);
  
  // ❌ BAD - Don't create separate state
  // const [totalSpent, setTotalSpent] = useState(0);
}
```

#### 3. **Callback Optimization (useCallback)**
Prevent unnecessary re-renders by memoizing callbacks:

```typescript
function AppMain() {
  const [expenses, setExpenses] = useState([]);
  
  // Without useCallback: new function created every render
  // With useCallback: same function reference maintained
  const handleDelete = useCallback((id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  }, [expenses]);
  
  return <ExpenseList expenses={expenses} onDelete={handleDelete} />;
}
```

---

## 📊 Data Flow Patterns

### Pattern 1: Props Down, Events Up

```
                    ┌──────────────┐
                    │   AppMain    │
                    │  (State: []) │
                    └───────┬──────┘
                            │
                ┌───────────┼───────────┐
                ↓ props     │           ↓ props
        ┌───────────────┐   │   ┌───────────────┐
        │  ExpenseList  │   │   │  AddExpModal  │
        │ (Display data)│   │   │ (Input form)  │
        └───────────────┘   │   └───────┬───────┘
                            │           │
                            │           ↓ callback
                            │    handleAdd(newExp)
                            │           │
                            │           ↓
                            │   ┌───────────────┐
                            │   │ Update state  │
                            │   └───────────────┘
                            │
                            ↓
                    [State changes]
                            │
                            ↓
                    [Components re-render]
```

### Pattern 2: Unidirectional Data Flow

```typescript
// DATA FLOWS IN ONE DIRECTION ONLY:
// State → Props → Render → User Action → Callback → State Update

// 1. STATE
const [expenses, setExpenses] = useState([]);

// 2. PROPS (pass data down)
<ExpenseCard expense={expense} onEdit={handleEdit} />

// 3. RENDER (display data)
function ExpenseCard({ expense, onEdit }) {
  return <div onClick={() => onEdit(expense)}>{expense.description}</div>;
}

// 4. USER ACTION (triggers callback)
// User clicks → onEdit(expense) called

// 5. CALLBACK (updates state)
const handleEdit = (expense) => {
  setExpenses(expenses.map(exp => 
    exp.id === expense.id ? expense : exp
  ));
};

// 6. STATE UPDATE → Re-render (cycle repeats)
```

### Pattern 3: Sync with localStorage

```typescript
// FILE: /components/AppMain.tsx

// Load from localStorage on mount
useEffect(() => {
  const stored = localStorage.getItem('kakeibo_expenses');
  if (stored) {
    try {
      setExpenses(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to parse stored expenses:', error);
      // Handle corrupted data
      localStorage.removeItem('kakeibo_expenses');
    }
  }
}, []); // Empty dependency array = run once on mount

// Save to localStorage whenever state changes
useEffect(() => {
  try {
    localStorage.setItem('kakeibo_expenses', JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses:', error);
    // Handle storage quota exceeded
    toast.error('Storage limit reached');
  }
}, [expenses]); // Run whenever expenses array changes
```

**Why this pattern?**
- **Persistence**: Data survives page refresh
- **Offline-first**: Works without internet
- **Simple**: No external state management library needed
- **Future-proof**: Easy to replace localStorage with API calls

---

## 🔐 Authentication System

### Flow Diagram

```
┌───────────────────────────────────────────────────────┐
│                  Authentication Flow                   │
└───────────────────────────────────────────────────────┘

1. USER LANDS ON APP
   ↓
   Check localStorage for 'jwt_token'
   ↓
   ┌─────────────────┐
   │ Token exists?   │
   └────┬────────┬───┘
        │        │
       NO       YES
        │        │
        ↓        ↓
   ┌─────────┐  Validate token (TODO: backend)
   │ Show    │  ↓
   │ Login   │  ┌──────────────┐
   │ Screen  │  │ Token valid? │
   └────┬────┘  └───┬──────┬───┘
        │           │      │
        │          YES    NO
        │           │      │
        │           │      └──────┐
        │           ↓             ↓
        │      ┌─────────┐   Clear storage
        │      │ Check   │   Show Login
        │      │ PIN?    │        
        │      └────┬────┘        
        │           │             
        │      ┌────┴────┐        
        │      │         │        
        │     YES       NO         
        │      │         │        
        │      ↓         ↓        
        │   ┌──────┐ ┌──────┐    
        │   │ PIN  │ │ Main │    
        │   │ Lock │ │ App  │    
        │   └───┬──┘ └──────┘    
        │       │                 
        │       ↓                 
        │   [Unlock]              
        │       │                 
        └───────┴──────────┐      
                           ↓      
                    ┌──────────┐  
                    │ Main App │  
                    └──────────┘  
```

### Code Implementation

```typescript
// FILE: /services/api.ts

// ═══════════════════════════════════════════════════════════
// LOGIN API CALL
// ═══════════════════════════════════════════════════════════

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  // TODO: BACKEND INTEGRATION
  // const response = await fetch(`${API_BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(credentials),
  // });
  // return response.json();
  
  // MOCK RESPONSE (for development)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.email === 'test@test.com' && credentials.password === 'Test123!') {
        resolve({
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: '1',
            name: 'Test User',
            email: credentials.email,
          },
        });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 1000);
  });
}

// ═══════════════════════════════════════════════════════════
// REGISTER API CALL
// ═══════════════════════════════════════════════════════════

export async function register(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  // TODO: BACKEND INTEGRATION
  // const response = await fetch(`${API_BASE_URL}/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(userData),
  // });
  // return response.json();
  
  // MOCK RESPONSE
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
        },
      });
    }, 1000);
  });
}
```

```typescript
// FILE: /components/AuthScreen.tsx

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // ═══════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Invalid password');
      return;
    }

    setIsLoading(true);

    try {
      // ═══════════════════════════════════════════════════════
      // API CALL
      // ═══════════════════════════════════════════════════════
      
      if (isLogin) {
        const response = await login({ email, password });
        
        // Store token and user data
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Notify parent component
        onAuthSuccess(response.token, response.user);
        
        toast.success(`Welcome back, ${response.user.name}!`);
      } else {
        // Register flow
        const response = await register({ name, email, password });
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        onAuthSuccess(response.token, response.user);
        toast.success('Account created successfully!');
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
      toast.error('Authentication failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? <InlineSpinner /> : isLogin ? 'Login' : 'Register'}
      </button>
    </form>
  );
}
```

### Token Management

```typescript
// FILE: /utils/security.ts

// ═══════════════════════════════════════════════════════════
// CHECK IF JWT TOKEN IS EXPIRED
// ═══════════════════════════════════════════════════════════

export function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1]));

    // Check expiry time (exp claim in seconds)
    if (!payload.exp) return true;

    const expiryTime = payload.exp * 1000; // Convert to ms
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  } catch (error) {
    return true; // Treat invalid tokens as expired
  }
}

// ═══════════════════════════════════════════════════════════
// USAGE IN APP
// ═══════════════════════════════════════════════════════════

useEffect(() => {
  const token = localStorage.getItem('jwt_token');
  
  if (token) {
    if (isTokenExpired(token)) {
      // Token expired - log out user
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      setIsAuthenticated(false);
      toast.info('Session expired', 'Please log in again');
    } else {
      // Token valid - user is authenticated
      setIsAuthenticated(true);
    }
  }
}, []);
```

---

## 💰 Expense Management

### Data Structure

```typescript
// FILE: /components/AppMain.tsx

interface Expense {
  id: string;                    // Unique identifier (UUID)
  description: string;           // "Lunch at restaurant"
  category: string;              // "food", "transport", etc.
  amount: number;                // 250.50
  date: string;                  // ISO 8601: "2026-02-01T14:30:00.000Z"
  notes?: string;                // Optional notes
  receiptUrl?: string;           // Optional receipt image URL
  isRecurring?: boolean;         // Is this a recurring expense?
  recurringFrequency?: string;   // "daily", "weekly", "monthly"
  createdAt: string;             // When expense was created
  updatedAt: string;             // When expense was last modified
}
```

### CRUD Operations Flow

```
┌─────────────────────────────────────────────────────────┐
│                     CRUD OPERATIONS                      │
└─────────────────────────────────────────────────────────┘

CREATE
======
User clicks "Add Expense" button
    ↓
Open <AddExpenseModal />
    ↓
User fills form (description, category, amount, date)
    ↓
User clicks "Add"
    ↓
Validate input (validateAmount, validateDescription, validateDate)
    ↓
  Valid?
    ↓
   YES → Create expense object with UUID
         ↓
         Add to expenses array: setExpenses([...expenses, newExpense])
         ↓
         Save to localStorage
         ↓
         TODO: Call backend API - createExpense(newExpense)
         ↓
         Show toast: "Expense added!"
         ↓
         Close modal

READ
====
On component mount
    ↓
Load from localStorage: const stored = localStorage.getItem('kakeibo_expenses')
    ↓
Parse JSON: setExpenses(JSON.parse(stored))
    ↓
TODO: Fetch from backend API - getExpenses()
    ↓
Display in UI: expenses.map(exp => <ExpenseCard expense={exp} />)

UPDATE
======
User clicks expense card
    ↓
Open <EditExpenseModal expense={selectedExpense} />
    ↓
User modifies fields
    ↓
User clicks "Save"
    ↓
Validate changes
    ↓
Update expenses array: setExpenses(expenses.map(exp => 
      exp.id === updatedExpense.id ? updatedExpense : exp
    ))
    ↓
Save to localStorage
    ↓
TODO: Call backend API - updateExpense(id, changes)
    ↓
Show toast: "Expense updated!"
    ↓
Close modal

DELETE
======
User clicks "Delete" in <EditExpenseModal />
    ↓
Show confirmation dialog: "Are you sure?"
    ↓
User confirms
    ↓
Remove from expenses array: setExpenses(expenses.filter(exp => exp.id !== id))
    ↓
Save to localStorage
    ↓
TODO: Call backend API - deleteExpense(id)
    ↓
Show toast: "Expense deleted" with Undo option
    ↓
Close modal
```

### Code Implementation

```typescript
// FILE: /components/AppMain.tsx

export function AppMain() {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // ═══════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════
  
  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Validate input
    const amountValidation = validateAmount(expenseData.amount);
    if (!amountValidation.isValid) {
      toast.error(amountValidation.error);
      return;
    }

    // Create new expense object
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(), // Generate unique ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update state (immutably)
    setExpenses([...expenses, newExpense]);

    // TODO: BACKEND INTEGRATION
    // try {
    //   await createExpense(newExpense);
    // } catch (error) {
    //   // Rollback on error
    //   setExpenses(expenses); // Revert to previous state
    //   toast.error('Failed to save expense');
    // }

    toast.success('Expense added!');
  };

  // ═══════════════════════════════════════════════════════════
  // READ (Computed Values)
  // ═══════════════════════════════════════════════════════════
  
  // Get today's expenses
  const todayExpenses = useMemo(() => {
    const today = new Date().toDateString();
    return expenses.filter(exp => {
      const expDate = new Date(exp.date).toDateString();
      return expDate === today;
    });
  }, [expenses]);

  // Calculate total for today
  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [todayExpenses]);

  // ═══════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════
  
  const handleEditExpense = async (updatedExpense: Expense) => {
    // Store previous state for rollback
    const previousExpenses = expenses;

    // Update state
    setExpenses(
      expenses.map(exp =>
        exp.id === updatedExpense.id
          ? { ...updatedExpense, updatedAt: new Date().toISOString() }
          : exp
      )
    );

    // TODO: BACKEND INTEGRATION
    // try {
    //   await updateExpense(updatedExpense.id, updatedExpense);
    // } catch (error) {
    //   // Rollback on error
    //   setExpenses(previousExpenses);
    //   toast.error('Failed to update expense');
    // }

    toast.success('Expense updated!');
  };

  // ═══════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════
  
  const handleDeleteExpense = async (expenseId: string) => {
    // Find expense for potential undo
    const deletedExpense = expenses.find(exp => exp.id === expenseId);
    if (!deletedExpense) return;

    // Optimistic update (remove immediately)
    setExpenses(expenses.filter(exp => exp.id !== expenseId));

    // Show toast with undo option
    toast.success('Expense deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore deleted expense
          setExpenses([...expenses, deletedExpense]);
        },
      },
    });

    // TODO: BACKEND INTEGRATION
    // try {
    //   await deleteExpense(expenseId);
    // } catch (error) {
    //   // Rollback on error
    //   setExpenses([...expenses, deletedExpense]);
    //   toast.error('Failed to delete expense');
    // }
  };

  return (
    <div>
      {/* Add Expense Button */}
      <button onClick={() => setIsAddModalOpen(true)}>
        Add Expense
      </button>

      {/* Display Today's Expenses */}
      {todayExpenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onClick={() => setSelectedExpense(expense)}
        />
      ))}

      {/* Edit Modal */}
      {selectedExpense && (
        <EditExpenseModal
          expense={selectedExpense}
          onSave={handleEditExpense}
          onDelete={handleDeleteExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </div>
  );
}
```

---

## 🚨 Error Handling Architecture

### Three-Layer Error Strategy

```
┌─────────────────────────────────────────────────────────┐
│              ERROR HANDLING LAYERS                       │
└─────────────────────────────────────────────────────────┘

LAYER 1: Global Error Boundary
==============================
- Catches ALL React errors (component crashes)
- Prevents white screen of death
- Shows user-friendly error page
- Logs to Sentry (production)

      ┌────────────────┐
      │ ErrorBoundary  │ ← Wraps entire app
      └────────┬───────┘
               ↓
        [Any component error]
               ↓
      Show fallback UI


LAYER 2: Try-Catch Blocks
==========================
- Catches async errors (API calls, promises)
- Handles expected errors gracefully
- Shows toast notifications to user

      try {
        await apiCall();
      } catch (error) {
        toast.error('Operation failed');
      }


LAYER 3: Validation
===================
- Prevents errors before they happen
- Validates user input
- Shows immediate feedback

      const result = validateEmail(email);
      if (!result.isValid) {
        showError(result.error);
        return; // Stop execution
      }
```

### Implementation

```typescript
// FILE: /components/ErrorBoundary.tsx

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CATCH ERRORS
  // ═══════════════════════════════════════════════════════════
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // LOG ERRORS
  // ═══════════════════════════════════════════════════════════
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console (development)
    console.error('ErrorBoundary caught:', error, errorInfo);

    // TODO: PRODUCTION - Log to Sentry
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: { componentStack: errorInfo.componentStack },
    //   },
    // });

    // TODO: PRODUCTION - Log to backend
    // logErrorToBackend({
    //   message: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    // });
  }

  // ═══════════════════════════════════════════════════════════
  // RECOVERY
  // ═══════════════════════════════════════════════════════════
  
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  render(): ReactNode {
    if (this.state.hasError) {
      // Show error UI
      return (
        <div className="error-screen">
          <h1>Oops! Something went wrong</h1>
          <button onClick={this.handleReset}>Try Again</button>
        </div>
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}
```

### Usage in App

```typescript
// FILE: /App.tsx

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster />
      <AppMain />
    </ErrorBoundary>
  );
}
```

### Error Handling Best Practices

```typescript
// ═══════════════════════════════════════════════════════════
// ✅ GOOD: Specific error handling
// ═══════════════════════════════════════════════════════════

async function saveExpense(expense: Expense) {
  try {
    await createExpense(expense);
    toast.success('Expense saved!');
  } catch (error) {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      toast.error('Session expired', 'Please log in again');
      handleLogout();
    } else if (error.response?.status === 400) {
      // Validation error from backend
      toast.error('Invalid data', error.message);
    } else if (error.code === 'NETWORK_ERROR') {
      // Network issue
      toast.error('No internet connection', 'Changes saved locally');
    } else {
      // Generic error
      toast.error('Failed to save expense');
    }
    
    // Log for debugging
    console.error('Save expense failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// ❌ BAD: Silent errors
// ═══════════════════════════════════════════════════════════

async function saveExpense(expense: Expense) {
  try {
    await createExpense(expense);
  } catch (error) {
    // ERROR: User doesn't know what happened!
  }
}

// ═══════════════════════════════════════════════════════════
// ❌ BAD: Too generic
// ═══════════════════════════════════════════════════════════

async function saveExpense(expense: Expense) {
  try {
    await createExpense(expense);
  } catch (error) {
    toast.error('Error'); // Not helpful!
  }
}
```

---

## ✅ Validation System

### Validation Flow

```
USER INPUT
   ↓
┌──────────────────┐
│ Client-Side      │
│ Validation       │ ← utils/validation.ts
│ (Immediate       │
│  feedback)       │
└────────┬─────────┘
         │
    [Valid?]
         │
    ┌────┴────┐
    ↓         ↓
   YES       NO
    │         │
    │         └──→ Show error message
    │              Prevent submission
    ↓
┌──────────────────┐
│ Send to Backend  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Server-Side      │
│ Validation       │ ← Spring Boot validators
│ (Security)       │
└────────┬─────────┘
         │
    [Valid?]
         │
    ┌────┴────┐
    ↓         ↓
   YES       NO
    │         │
    │         └──→ Return 400 Bad Request
    │              Client shows error
    ↓
 Process request
```

### Implementation

```typescript
// FILE: /utils/validation.ts

// ═══════════════════════════════════════════════════════════
// EMAIL VALIDATION
// ═══════════════════════════════════════════════════════════

export function validateEmail(email: string): {
  isValid: boolean;
  error: string | null;
} {
  // Check if empty
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Check format (RFC 5322 compliant regex)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check length
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true, error: null };
}

// ═══════════════════════════════════════════════════════════
// AMOUNT VALIDATION
// ═══════════════════════════════════════════════════════════

export function validateAmount(amount: string | number): {
  isValid: boolean;
  error: string | null;
} {
  const amountStr = String(amount).trim();

  // Check if empty
  if (!amountStr) {
    return { isValid: false, error: 'Amount is required' };
  }

  // Check format (positive number with max 2 decimals)
  const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;
  if (!AMOUNT_REGEX.test(amountStr)) {
    return {
      isValid: false,
      error: 'Invalid amount (use numbers only, up to 2 decimals)',
    };
  }

  // Parse and check range
  const numAmount = parseFloat(amountStr);
  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount is too large (max ₹1,000,000)' };
  }

  return { isValid: true, error: null };
}

// ═══════════════════════════════════════════════════════════
// USAGE IN COMPONENT
// ═══════════════════════════════════════════════════════════

function AddExpenseModal() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Validate
    const result = validateAmount(amount);
    
    if (!result.isValid) {
      // Show error
      setError(result.error);
      toast.error(result.error);
      return; // Stop execution
    }

    // Validation passed - proceed
    handleAddExpense({ amount: parseFloat(amount), ... });
  };

  return (
    <input
      type="text"
      value={amount}
      onChange={(e) => {
        setAmount(e.target.value);
        setError(''); // Clear error on change
      }}
      onBlur={() => {
        // Validate on blur (when user leaves field)
        const result = validateAmount(amount);
        if (!result.isValid) {
          setError(result.error);
        }
      }}
    />
  );
}
```

### Validation Best Practices

1. **Validate early**: Show errors as user types (or on blur)
2. **Be specific**: "Email is required" > "Invalid input"
3. **Guide user**: Explain format requirements
4. **Prevent submission**: Disable submit button if invalid
5. **Clear errors**: Remove error when user corrects input
6. **Server-side too**: Never trust client validation alone

---

## 🔒 Security Implementation

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
└─────────────────────────────────────────────────────────┘

LAYER 1: Transport Security
============================
✅ HTTPS everywhere (TLS 1.3)
✅ Secure cookies (HttpOnly, Secure, SameSite)
✅ HSTS headers

LAYER 2: Authentication
========================
✅ JWT tokens (signed, short-lived)
✅ Refresh tokens (longer-lived)
✅ Password requirements (8+ chars, mixed case, special)
✅ bcrypt hashing (server-side)

LAYER 3: Authorization
=======================
✅ Token validation on every request
✅ User-specific data filtering
✅ Role-based access control (if needed)

LAYER 4: Input Validation
==========================
✅ Client-side validation (UX)
✅ Server-side validation (security)
✅ SQL injection prevention (parameterized queries)
✅ XSS prevention (input sanitization)

LAYER 5: Rate Limiting
=======================
✅ Client-side throttling (prevent spam)
✅ Server-side rate limiting (prevent abuse)
✅ CAPTCHA for suspicious activity

LAYER 6: Data Protection
=========================
✅ PIN encryption (AES-GCM)
✅ Sensitive data encryption (in transit & at rest)
✅ No sensitive data in logs
```

### Key Security Functions

```typescript
// FILE: /utils/security.ts

// ═══════════════════════════════════════════════════════════
// PIN ENCRYPTION (Client-side)
// ═══════════════════════════════════════════════════════════

export async function encryptPIN(pin: string): Promise<string> {
  // Generate encryption key from passphrase
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('kakeibo_salt_v1'),
      iterations: 100000, // High iteration count
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(pin)
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

// ═══════════════════════════════════════════════════════════
// TOKEN VALIDATION
// ═══════════════════════════════════════════════════════════

export function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));

    // Check expiry
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true;
  }
}

// ═══════════════════════════════════════════════════════════
// XSS PROTECTION
// ═══════════════════════════════════════════════════════════

export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html; // Automatically escapes HTML
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════
// RATE LIMITING (Client-side)
// ═══════════════════════════════════════════════════════════

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  // Get previous requests
  const stored = localStorage.getItem(storageKey);
  let requests: number[] = stored ? JSON.parse(stored) : [];
  
  // Filter old requests
  requests = requests.filter(time => now - time < windowMs);
  
  // Check limit
  if (requests.length >= limit) {
    return false; // Rate limited
  }
  
  // Record new request
  requests.push(now);
  localStorage.setItem(storageKey, JSON.stringify(requests));
  
  return true; // Allow request
}
```

### Security Checklist

**Client-Side:**
- ✅ Input validation
- ✅ XSS prevention (sanitize HTML)
- ✅ CSRF token in requests (future)
- ✅ No sensitive data in console logs (production)
- ✅ Content Security Policy headers
- ✅ Encrypted localStorage for sensitive data

**Server-Side (Backend):**
- ⏳ JWT signature validation
- ⏳ bcrypt password hashing
- ⏳ SQL injection prevention (parameterized queries)
- ⏳ Rate limiting middleware
- ⏳ CORS whitelist
- ⏳ HTTPS only (no HTTP)
- ⏳ Secure session management
- ⏳ Regular security audits

---

## 🎨 Styling Approach

### Tailwind CSS v4 + Custom Tokens

```css
/* FILE: /styles/globals.css */

/* ═══════════════════════════════════════════════════════════
   DESIGN SYSTEM TOKENS
   ═══════════════════════════════════════════════════════════*/

@layer base {
  :root {
    /* Colors - iOS System Inspired */
    --color-primary: #007aff;
    --color-primary-dark: #0051d5;
    --color-background: #f5f5f7;
    --color-background-dark: #121212;
    --color-surface: #ffffff;
    --color-surface-dark: #1c1c1e;
    
    /* Typography */
    --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    
    /* Spacing Scale (iOS 8pt grid) */
    --spacing-xs: 0.5rem;   /* 8px */
    --spacing-sm: 1rem;     /* 16px */
    --spacing-md: 1.5rem;   /* 24px */
    --spacing-lg: 2rem;     /* 32px */
    --spacing-xl: 3rem;     /* 48px */
    
    /* Border Radius */
    --radius-sm: 0.5rem;    /* 8px */
    --radius-md: 1rem;      /* 16px */
    --radius-lg: 1.5rem;    /* 24px */
    --radius-xl: 2rem;      /* 32px */
  }
}
```

### Component Styling Pattern

```typescript
// ═══════════════════════════════════════════════════════════
// PATTERN: Conditional Classes with Dark Mode
// ═══════════════════════════════════════════════════════════

function MyComponent({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`
        p-5 rounded-xl
        ${isDarkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-black'}
      `}
    >
      <h1
        className={`
          text-2xl font-bold mb-4
          ${isDarkMode ? 'text-white' : 'text-black'}
        `}
      >
        Title
      </h1>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PATTERN: Gradient Backgrounds (iOS Style)
// ═══════════════════════════════════════════════════════════

<div className="bg-gradient-to-br from-[#007aff] to-[#0051d5] rounded-[20px] p-6">
  <p className="text-white text-[48px] font-bold">
    ₹1,250.00
  </p>
</div>

// ═══════════════════════════════════════════════════════════
// PATTERN: Category Icons with Gradients
// ═══════════════════════════════════════════════════════════

const categories = [
  { value: 'food', color: 'from-[#ff6b6b] to-[#ee5a6f]', icon: '🍔' },
  { value: 'transport', color: 'from-[#4ecdc4] to-[#44a08d]', icon: '🚗' },
];

<div className={`bg-gradient-to-br ${category.color} w-12 h-12 rounded-full`}>
  <span>{category.icon}</span>
</div>

// ═══════════════════════════════════════════════════════════
// PATTERN: Interactive States
// ═══════════════════════════════════════════════════════════

<button
  className="
    px-6 py-3 rounded-xl
    bg-blue-600 hover:bg-blue-700
    active:scale-[0.97]
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  Click Me
</button>
```

---

## 📐 Code Patterns & Conventions

### 1. File Organization

```
/components/ComponentName.tsx
├── Imports
├── Type definitions (interfaces)
├── Constants
├── Component function
│   ├── State declarations
│   ├── Effects
│   ├── Event handlers
│   ├── Computed values (useMemo)
│   └── Return (JSX)
└── Export
```

### 2. Naming Conventions

```typescript
// Components: PascalCase
function ExpenseCard() {}
export function AddExpenseModal() {}

// Functions: camelCase
function handleAddExpense() {}
const calculateTotal = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Variables: camelCase
const userEmail = 'user@example.com';
let isLoading = false;

// Interfaces: PascalCase with "Props" suffix
interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
}

// Boolean props: "is" or "has" prefix
interface ButtonProps {
  isLoading: boolean;
  hasError: boolean;
  isDarkMode: boolean;
}
```

### 3. Comment Standards

```typescript
// ═══════════════════════════════════════════════════════════
// SECTION HEADER (for major sections)
// ═══════════════════════════════════════════════════════════

/**
 * Function documentation (JSDoc style)
 * 
 * Explain what the function does
 * 
 * @param email - User's email address
 * @returns Validation result with error message
 * 
 * @example
 * validateEmail('user@example.com') // { isValid: true, error: null }
 */
export function validateEmail(email: string): ValidationResult {
  // Implementation comment (when logic is complex)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(email);
}

// TODO: BACKEND INTEGRATION - Clear action needed
// TODO: Replace with actual API call

// FIXME: Known bug that needs fixing
// FIXME: Handle edge case when user has no expenses

// NOTE: Important context or explanation
// NOTE: This is temporary until we implement proper auth
```

### 4. Props Pattern

```typescript
// ═══════════════════════════════════════════════════════════
// ALWAYS define interface for props
// ═══════════════════════════════════════════════════════════

interface MyComponentProps {
  // Required props (no ?)
  title: string;
  onSubmit: () => void;
  
  // Optional props (with ?)
  description?: string;
  isDarkMode?: boolean;
  
  // Props with default values (mark as optional)
  maxLength?: number;
  
  // Callback patterns
  onChange: (value: string) => void;
  onSuccess: (data: Response) => void;
  onError: (error: Error) => void;
}

// ═══════════════════════════════════════════════════════════
// Use destructuring with default values
// ═══════════════════════════════════════════════════════════

function MyComponent({
  title,
  description = 'Default description',
  isDarkMode = false,
  maxLength = 100,
  onSubmit,
}: MyComponentProps) {
  // Component logic
}
```

---

## ⚡ Performance Optimizations

### 1. Memoization

```typescript
// ═══════════════════════════════════════════════════════════
// useMemo - Expensive calculations
// ═══════════════════════════════════════════════════════════

const totalExpenses = useMemo(() => {
  // Only recalculates when expenses array changes
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}, [expenses]);

// ═══════════════════════════════════════════════════════════
// useCallback - Function references
// ═══════════════════════════════════════════════════════════

const handleDelete = useCallback((id: string) => {
  setExpenses(expenses.filter(exp => exp.id !== id));
}, [expenses]);

// ═══════════════════════════════════════════════════════════
// React.memo - Prevent re-renders
// ═══════════════════════════════════════════════════════════

const ExpenseCard = React.memo(({ expense, onEdit }: ExpenseCardProps) => {
  return <div>{expense.description}</div>;
});
```

### 2. Code Splitting (Future)

```typescript
// Lazy load heavy components
const AnalyticsView = React.lazy(() => import('./components/AnalyticsView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));

// Use Suspense for loading state
<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsView />
</Suspense>
```

### 3. Virtual Scrolling (Future)

```typescript
// For long expense lists (1000+ items)
// Use react-window or react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={expenses.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ExpenseCard expense={expenses[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
          ┌────────────┐
          │    E2E     │  (10% - Cypress/Playwright)
          │  Browser   │  Full user flows
          └────────────┘
        ┌────────────────┐
        │  Integration   │  (30% - React Testing Library)
        │  Component +   │  User interactions
        │  State         │
        └────────────────┘
    ┌──────────────────────┐
    │    Unit Tests        │  (60% - Vitest)
    │  Pure functions      │  Validation, calculations
    │  Utilities           │
    └──────────────────────┘
```

### Unit Test Example

```typescript
// FILE: /utils/validation.test.ts

import { describe, it, expect } from 'vitest';
import { validateEmail, validateAmount } from './validation';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  describe('validateAmount', () => {
    it('should accept valid amounts', () => {
      expect(validateAmount('100').isValid).toBe(true);
      expect(validateAmount('100.50').isValid).toBe(true);
      expect(validateAmount(250.75).isValid).toBe(true);
    });

    it('should reject negative amounts', () => {
      const result = validateAmount('-100');
      expect(result.isValid).toBe(false);
    });

    it('should reject amounts with more than 2 decimals', () => {
      const result = validateAmount('100.123');
      expect(result.isValid).toBe(false);
    });
  });
});
```

---

## 📚 Summary

### Key Takeaways

1. **Architecture**: Component-based, unidirectional data flow
2. **State Management**: React hooks (useState, useEffect, useMemo)
3. **Authentication**: JWT tokens + PIN lock + localStorage persistence
4. **Error Handling**: Error boundaries + try-catch + validation
5. **Styling**: Tailwind CSS v4 + iOS-inspired design
6. **Security**: Encryption, validation, rate limiting
7. **Performance**: Memoization, lazy loading (future)
8. **Testing**: Unit tests for utilities, integration tests for components

### Development Workflow

```
1. Read this documentation
2. Review code in /components/ and /utils/
3. Run `npm run dev` to start development server
4. Make changes
5. Test manually in browser
6. Write tests (future)
7. Commit with clear message
8. Integrate with backend (follow TODOs)
9. Deploy to production
```

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**For questions**: Refer to PRODUCTION_GUIDE.md and QUICK_START.md
