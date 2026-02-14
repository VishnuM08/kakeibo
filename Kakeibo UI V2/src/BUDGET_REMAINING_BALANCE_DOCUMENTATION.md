# 💰 Budget Remaining Balance Feature - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Feature Description](#feature-description)
3. [Component Architecture](#component-architecture)
4. [Backend Integration](#backend-integration)
5. [Data Flow](#data-flow)
6. [API Specification](#api-specification)
7. [Code Implementation](#code-implementation)
8. [User Interface](#user-interface)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Testing Scenarios](#testing-scenarios)

---

## 🎯 Overview

The **Budget Remaining Balance** feature displays the amount of money remaining in the user's monthly budget after accounting for all expenses. This helps users stay on track with their spending goals and provides real-time feedback on their financial health.

### Key Benefits:
- ✅ **Real-time Updates**: Balance updates automatically when expenses are added/edited/deleted
- ✅ **Visual Feedback**: Color-coded indicators (green, yellow, red) based on budget status
- ✅ **Smart Insights**: Daily spending allowance and days remaining calculations
- ✅ **Offline Support**: Works offline with local calculations, syncs when online
- ✅ **Mobile Optimized**: iOS-style design with large touch targets

---

## 📱 Feature Description

### What It Shows:

1. **Remaining Balance**: Budget - Total Spent = Remaining
2. **Budget Summary**:
   - Total budget set for the month
   - Total amount spent so far
   - Days remaining in the month
   - Daily spending allowance

3. **Visual Indicators**:
   - Progress bar showing percentage of budget used
   - Color-coded status (green/yellow/red)
   - Status icons (trending up/down, alert)

4. **Smart Tips**:
   - If on track: "You can spend ₹X per day for the next Y days"
   - If over budget: "You've exceeded your budget by ₹X"

### When It Appears:

- Shows only when a monthly budget is set
- Updates in real-time when expenses change
- Displayed prominently on the main dashboard
- Positioned below the budget warning banner

---

## 🏗️ Component Architecture

```
BudgetRemainingBalance Component
│
├── Props Input
│   ├── monthlyBudget (number | null)
│   ├── currentSpending (number)
│   ├── onSetBudget (callback)
│   └── isDarkMode (boolean)
│
├── State Management
│   ├── remainingBalance (from API or local)
│   ├── isLoading (API call status)
│   └── isOffline (connection status)
│
├── Computed Values
│   ├── percentageSpent
│   ├── daysRemaining
│   ├── dailyAllowance
│   └── isOverBudget
│
├── API Integration
│   └── GET /api/budget/current
│       └── Fetches real-time remaining balance
│
└── UI Rendering
    ├── Header (title, edit button)
    ├── Main Balance (large number display)
    ├── Stats Grid (4 cards)
    ├── Progress Bar (visual indicator)
    └── Smart Tip (helpful message)
```

---

## 🔌 Backend Integration

### Spring Boot API Requirements

#### 1. Store Budget Endpoint

```http
POST /api/budget
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50000.00,
  "month": "2026-02",
  "year": 2026
}
```

**Response (201 Created):**
```json
{
  "id": "budget-uuid-123",
  "userId": "user-uuid-456",
  "amount": 50000.00,
  "month": "2026-02",
  "year": 2026,
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-02-01T10:00:00Z"
}
```

**Spring Boot Controller Example:**
```java
@RestController
@RequestMapping("/api/budget")
public class BudgetController {
    
    @Autowired
    private BudgetService budgetService;
    
    @PostMapping
    public ResponseEntity<BudgetResponse> createOrUpdateBudget(
        @RequestHeader("Authorization") String token,
        @RequestBody BudgetRequest request
    ) {
        String userId = jwtService.extractUserId(token);
        Budget budget = budgetService.saveBudget(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BudgetResponse.from(budget));
    }
}
```

**Service Layer Logic:**
```java
@Service
public class BudgetService {
    
    @Autowired
    private BudgetRepository budgetRepository;
    
    @Autowired
    private ExpenseRepository expenseRepository;
    
    public Budget saveBudget(String userId, BudgetRequest request) {
        // Check if budget exists for this month
        Optional<Budget> existing = budgetRepository
            .findByUserIdAndMonthAndYear(userId, request.getMonth(), request.getYear());
        
        Budget budget;
        if (existing.isPresent()) {
            // Update existing budget
            budget = existing.get();
            budget.setAmount(request.getAmount());
            budget.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new budget
            budget = Budget.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .amount(request.getAmount())
                .month(request.getMonth())
                .year(request.getYear())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        }
        
        return budgetRepository.save(budget);
    }
}
```

---

#### 2. Get Current Budget Endpoint

```http
GET /api/budget/current
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
month (optional): 2026-02 (defaults to current month)
```

**Response (200 OK):**
```json
{
  "budget": 50000.00,
  "spent": 22350.50,
  "remaining": 27649.50,
  "percentage": 44.70,
  "isOverBudget": false,
  "daysRemaining": 15,
  "dailyAllowance": 1843.30,
  "month": "February 2026"
}
```

**Response When No Budget Set (200 OK):**
```json
{
  "budget": null,
  "spent": 22350.50,
  "remaining": null,
  "percentage": 0,
  "isOverBudget": false,
  "daysRemaining": 15,
  "dailyAllowance": 0,
  "month": "February 2026"
}
```

**Response When Over Budget:**
```json
{
  "budget": 20000.00,
  "spent": 25500.00,
  "remaining": -5500.00,
  "percentage": 127.50,
  "isOverBudget": true,
  "daysRemaining": 15,
  "dailyAllowance": 0,
  "month": "February 2026"
}
```

**Spring Boot Controller Example:**
```java
@GetMapping("/current")
public ResponseEntity<BudgetCurrentResponse> getCurrentBudget(
    @RequestHeader("Authorization") String token,
    @RequestParam(required = false) String month
) {
    String userId = jwtService.extractUserId(token);
    
    // Use current month if not specified
    LocalDate date = month != null 
        ? LocalDate.parse(month + "-01") 
        : LocalDate.now();
    
    BudgetCurrentResponse response = budgetService.getCurrentBudget(userId, date);
    return ResponseEntity.ok(response);
}
```

**Service Layer Calculation:**
```java
public BudgetCurrentResponse getCurrentBudget(String userId, LocalDate date) {
    String month = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    int year = date.getYear();
    
    // Get budget for the month
    Optional<Budget> budget = budgetRepository
        .findByUserIdAndMonthAndYear(userId, month, year);
    
    // Calculate total spent for the month
    LocalDateTime startOfMonth = date.withDayOfMonth(1).atStartOfDay();
    LocalDateTime endOfMonth = date.withDayOfMonth(date.lengthOfMonth())
        .atTime(23, 59, 59);
    
    BigDecimal totalSpent = expenseRepository
        .sumAmountByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);
    
    if (totalSpent == null) totalSpent = BigDecimal.ZERO;
    
    // Calculate remaining and other metrics
    BigDecimal budgetAmount = budget.map(Budget::getAmount).orElse(null);
    BigDecimal remaining = budgetAmount != null 
        ? budgetAmount.subtract(totalSpent) 
        : null;
    
    double percentage = budgetAmount != null && budgetAmount.compareTo(BigDecimal.ZERO) > 0
        ? totalSpent.divide(budgetAmount, 2, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue()
        : 0;
    
    boolean isOverBudget = remaining != null && remaining.compareTo(BigDecimal.ZERO) < 0;
    
    // Calculate days remaining in month
    int daysRemaining = Math.max(0, date.lengthOfMonth() - date.getDayOfMonth());
    
    // Calculate daily allowance
    BigDecimal dailyAllowance = BigDecimal.ZERO;
    if (remaining != null && daysRemaining > 0 && remaining.compareTo(BigDecimal.ZERO) > 0) {
        dailyAllowance = remaining.divide(
            BigDecimal.valueOf(daysRemaining), 
            2, 
            RoundingMode.HALF_UP
        );
    }
    
    return BudgetCurrentResponse.builder()
        .budget(budgetAmount)
        .spent(totalSpent)
        .remaining(remaining)
        .percentage(percentage)
        .isOverBudget(isOverBudget)
        .daysRemaining(daysRemaining)
        .dailyAllowance(dailyAllowance)
        .month(date.format(DateTimeFormatter.ofPattern("MMMM yyyy")))
        .build();
}
```

**Database Query (PostgreSQL):**
```sql
-- Get total spent for the month
SELECT COALESCE(SUM(amount), 0) as total_spent
FROM expenses
WHERE user_id = ?
  AND date >= ?  -- Start of month
  AND date <= ?  -- End of month
  AND deleted_at IS NULL;
```

---

## 📊 Data Flow

### Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                               │
└──────────────────────────────────────────────────────────────┘

1. USER SETS BUDGET
   ↓
   User clicks "Set Budget" button
   ↓
   BudgetSettingsModal opens
   ↓
   User enters amount (e.g., ₹50,000)
   ↓
   User clicks "Save"
   ↓
   POST /api/budget { amount: 50000, month: "2026-02", year: 2026 }
   ↓
   Backend saves to database
   ↓
   Response: { id, amount, month, year }
   ↓
   Frontend updates monthlyBudget state
   ↓
   BudgetRemainingBalance component re-renders


2. COMPONENT LOADS
   ↓
   BudgetRemainingBalance mounts
   ↓
   useEffect triggered
   ↓
   Call fetchRemainingBalance()
   ↓
   GET /api/budget/current
   ↓
   Backend calculates:
      - Total budget for month
      - Total expenses for month
      - Remaining = Budget - Expenses
      - Percentage, days left, daily allowance
   ↓
   Response: { budget, spent, remaining, percentage, ... }
   ↓
   Frontend updates remainingBalance state
   ↓
   UI renders with data


3. USER ADDS EXPENSE
   ↓
   User adds expense (e.g., ₹500)
   ↓
   POST /api/expenses { description, amount: 500, ... }
   ↓
   Backend saves expense
   ↓
   Frontend adds expense to local state
   ↓
   currentSpending increases by ₹500
   ↓
   useEffect in BudgetRemainingBalance triggers
      (depends on currentSpending)
   ↓
   fetchRemainingBalance() called again
   ↓
   GET /api/budget/current
   ↓
   Backend recalculates with new expense
   ↓
   Response: { remaining: 49500 } (was 50000)
   ↓
   UI updates to show new remaining balance


4. REAL-TIME POLLING (Optional)
   ↓
   Every 30 seconds:
      fetchRemainingBalance()
      ↓
      GET /api/budget/current
      ↓
      Update if changed
   
   OR

   WebSocket Connection:
      ↓
      Backend sends update when expense added
      ↓
      Frontend receives event
      ↓
      Update remaining balance immediately
```

---

## 💻 Code Implementation

### Frontend Component

```typescript
// FILE: /components/BudgetRemainingBalance.tsx

import { Wallet, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BudgetRemainingBalanceProps {
  monthlyBudget: number | null;      // Total budget for month
  currentSpending: number;            // Current total spent
  onSetBudget: () => void;            // Callback to open budget modal
  isDarkMode?: boolean;               // Theme preference
}

export function BudgetRemainingBalance({
  monthlyBudget,
  currentSpending,
  onSetBudget,
  isDarkMode = false,
}: BudgetRemainingBalanceProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════
  
  // Calculate remaining locally (fallback)
  const localRemaining = monthlyBudget ? monthlyBudget - currentSpending : null;
  
  // Calculate percentage spent
  const percentageSpent = monthlyBudget ? (currentSpending / monthlyBudget) * 100 : 0;
  
  // Check if over budget
  const isOverBudget = localRemaining !== null && localRemaining < 0;
  
  // Calculate days remaining in month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, lastDayOfMonth.getDate() - today.getDate());
  
  // Calculate daily spending allowance
  const dailyAllowance = localRemaining && daysRemaining > 0 
    ? localRemaining / daysRemaining 
    : 0;

  // ═══════════════════════════════════════════════════════════
  // API CALLS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Fetch remaining balance from backend
   */
  const fetchRemainingBalance = async () => {
    if (!monthlyBudget) return;
    
    setIsLoading(true);
    setIsOffline(false);
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/budget/current`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget');
      }
      
      const data = await response.json();
      setRemainingBalance(data.remaining);
      
    } catch (error) {
      console.error('Failed to fetch remaining balance:', error);
      
      // Fallback to local calculation
      setRemainingBalance(localRemaining);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Fetch balance when budget or spending changes
   */
  useEffect(() => {
    fetchRemainingBalance();
  }, [monthlyBudget, currentSpending]);

  /**
   * Poll API every 30 seconds for updates
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRemainingBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [monthlyBudget]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  // Show "Set Budget" CTA if no budget set
  if (!monthlyBudget) {
    return (
      <button onClick={onSetBudget} className="...">
        <Wallet />
        <div>
          <p>Set Monthly Budget</p>
          <p>Track your spending limit</p>
        </div>
      </button>
    );
  }

  return (
    <div className="budget-remaining-card">
      {/* Header */}
      <div className="header">
        <Wallet />
        <h3>Remaining Balance</h3>
        {isOffline && <span>Offline</span>}
        <button onClick={onSetBudget}>Edit</button>
      </div>

      {/* Main Balance */}
      <div className="main-balance">
        {isLoading ? (
          <LoadingDots />
        ) : (
          <>
            <span className="amount">
              ₹{Math.abs(remainingBalance || localRemaining || 0).toFixed(2)}
            </span>
            {isOverBudget && <span>over budget</span>}
          </>
        )}
        <p>
          {isOverBudget ? 'You\'ve exceeded your budget' : 'Available to spend this month'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div>
          <p>Budget</p>
          <p>₹{monthlyBudget.toFixed(2)}</p>
        </div>
        <div>
          <p>Spent</p>
          <p>₹{currentSpending.toFixed(2)}</p>
        </div>
        <div>
          <p>Days Left</p>
          <p>{daysRemaining}</p>
        </div>
        <div>
          <p>Per Day</p>
          <p>₹{Math.max(0, dailyAllowance).toFixed(2)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar percentage={percentageSpent} isOverBudget={isOverBudget} />

      {/* Smart Tip */}
      {!isOverBudget && daysRemaining > 0 && (
        <Tip>
          💡 You can spend <strong>₹{dailyAllowance.toFixed(2)}</strong> per day 
          for the next {daysRemaining} days to stay on budget.
        </Tip>
      )}

      {isOverBudget && (
        <Warning>
          ⚠️ You've exceeded your monthly budget by 
          <strong>₹{Math.abs(localRemaining || 0).toFixed(2)}</strong>. 
          Consider reviewing your expenses.
        </Warning>
      )}
    </div>
  );
}
```

---

## 🎨 User Interface

### Visual States

#### 1. No Budget Set
```
┌─────────────────────────────────────────┐
│  💰  Set Monthly Budget                 │
│      Track your spending limit      [>] │
└─────────────────────────────────────────┘
```

#### 2. On Track (< 50% spent)
```
┌─────────────────────────────────────────┐
│  💰 Remaining Balance           [Edit]  │
│                                          │
│  ₹27,649.50                              │
│  Available to spend this month           │
│                                          │
│  ┌─────────┬──────────┬──────────┬─────┐│
│  │ Budget  │  Spent   │Days Left │/Day ││
│  │₹50,000  │ ₹22,350  │   15     │₹1843││
│  └─────────┴──────────┴──────────┴─────┘│
│                                          │
│  44% used    [████████░░░░░] 🟢 On Track│
│                                          │
│  💡 You can spend ₹1,843 per day for    │
│     the next 15 days to stay on budget  │
└─────────────────────────────────────────┘
```

#### 3. Warning (80-100% spent)
```
┌─────────────────────────────────────────┐
│  💰 Remaining Balance           [Edit]  │
│                                          │
│  ₹5,000.00                               │
│  Available to spend this month           │
│                                          │
│  ┌─────────┬──────────┬──────────┬─────┐│
│  │ Budget  │  Spent   │Days Left │/Day ││
│  │₹50,000  │ ₹45,000  │   10     │₹500 ││
│  └─────────┴──────────┴──────────┴─────┘│
│                                          │
│  90% used  [█████████████████░] 🟡 Almost││
│                                          │
└─────────────────────────────────────────┘
```

#### 4. Over Budget (> 100% spent)
```
┌─────────────────────────────────────────┐
│  💰 Remaining Balance           [Edit]  │
│                                          │
│  ₹5,500.00                               │
│  over budget                             │
│  You've exceeded your budget             │
│                                          │
│  ┌─────────┬──────────┬──────────┬─────┐│
│  │ Budget  │  Spent   │Days Left │/Day ││
│  │₹20,000  │ ₹25,500  │   15     │  ₹0 ││
│  └─────────┴──────────┴──────────┴─────┘│
│                                          │
│  127% used [████████████████████] 🔴Over │
│                                          │
│  ⚠️ You've exceeded your monthly budget  │
│     by ₹5,500. Consider reviewing your  │
│     expenses or adjusting your budget.  │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Manual Testing Checklist

- [ ] **No Budget**: Shows "Set Budget" button
- [ ] **Budget Set**: Displays remaining balance correctly
- [ ] **Add Expense**: Balance decreases immediately
- [ ] **Delete Expense**: Balance increases immediately
- [ ] **Edit Expense**: Balance updates correctly
- [ ] **Month Change**: Balance resets for new month
- [ ] **Over Budget**: Shows negative value in red
- [ ] **Days Calculation**: Correctly shows days left
- [ ] **Daily Allowance**: Calculates correctly
- [ ] **Progress Bar**: Fills correctly based on percentage
- [ ] **Color Coding**: Green < 80%, Yellow 80-100%, Red > 100%
- [ ] **Offline Mode**: Shows "(Offline)" indicator
- [ ] **Loading State**: Shows loading dots during API call
- [ ] **Dark Mode**: All colors work in dark theme
- [ ] **Responsive**: Works on mobile screens

### API Testing

```bash
# 1. Set budget
curl -X POST http://localhost:8080/api/budget \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "month": "2026-02", "year": 2026}'

# 2. Get current budget
curl -X GET http://localhost:8080/api/budget/current \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {
#   "budget": 50000.00,
#   "spent": 22350.50,
#   "remaining": 27649.50,
#   "percentage": 44.70,
#   "isOverBudget": false,
#   "daysRemaining": 15,
#   "dailyAllowance": 1843.30,
#   "month": "February 2026"
# }
```

---

## 📚 Summary

### Key Points:

1. **Two API Endpoints**:
   - `POST /api/budget` - Store/update monthly budget
   - `GET /api/budget/current` - Get remaining balance with calculations

2. **Real-time Updates**:
   - Balance recalculates when expenses change
   - Optional polling every 30 seconds
   - WebSocket alternative for instant updates

3. **Offline Support**:
   - Falls back to local calculation if API fails
   - Shows offline indicator
   - Syncs when connection restored

4. **Smart Features**:
   - Daily spending allowance calculation
   - Visual progress indicators
   - Contextual tips and warnings

5. **User Experience**:
   - Clean, iOS-style interface
   - Color-coded feedback
   - Large, readable numbers
   - Helpful insights

---

**Last Updated**: February 9, 2026  
**Version**: 1.0.0  
**Component**: `/components/BudgetRemainingBalance.tsx`  
**API Base**: `/api/budget/*`
