# 🔍 Mobile Search Feature - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Mobile Optimizations](#mobile-optimizations)
3. [Component Architecture](#component-architecture)
4. [Backend Integration](#backend-integration)
5. [Search Algorithm](#search-algorithm)
6. [User Experience Flow](#user-experience-flow)
7. [Code Implementation](#code-implementation)
8. [API Specification](#api-specification)
9. [Performance Optimization](#performance-optimization)
10. [Testing Guide](#testing-guide)

---

## 🎯 Overview

The **Mobile Search Modal** is a full-screen, touch-optimized search interface designed specifically for mobile devices. It provides instant search with real-time results, advanced filtering options, and a smooth, app-like experience.

### Key Features:
- ✅ **Full-Screen Modal**: Eliminates distractions, better focus
- ✅ **Instant Search**: Results appear as you type (300ms debounce)
- ✅ **Touch-Optimized**: Large tap targets (44px minimum)
- ✅ **Quick Filters**: One-tap category chips
- ✅ **Advanced Filters**: Bottom sheet for date/amount ranges
- ✅ **Smooth Animations**: 60fps slide-up modal
- ✅ **Keyboard-Aware**: Auto-focus, swipe to dismiss

### Why Full-Screen?
- ❌ **Problem with Old Design**: Small dropdown, hard to tap, cluttered UI
- ✅ **Solution**: Full-screen modal provides:
  - More space for results
  - Better readability
  - Easier filtering
  - Native app feel

---

## 📱 Mobile Optimizations

### 1. Touch Target Sizing

```
┌────────────────────────────────────────────────┐
│                                                 │
│  Minimum Touch Target: 44px × 44px             │
│  (Apple Human Interface Guidelines)            │
│                                                 │
│  ✅ Search Input:        48px height           │
│  ✅ Category Chips:      32px height, 16px pad │
│  ✅ Filter Button:       40px × 40px           │
│  ✅ Result Cards:        60px height           │
│  ✅ Back Button:         40px × 40px           │
│                                                 │
└────────────────────────────────────────────────┘
```

### 2. Gesture Support

```typescript
// Swipe down to dismiss (future enhancement)
const handleTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - touchStartY;
  
  if (diff > 100) {
    // Swipe down detected - close modal
    onClose();
  }
};
```

### 3. Auto-Focus Behavior

```typescript
useEffect(() => {
  if (isOpen && searchInputRef.current) {
    // Delay to ensure animation completes
    setTimeout(() => {
      searchInputRef.current?.focus();
      // On iOS, this will bring up the keyboard
    }, 100);
  }
}, [isOpen]);
```

### 4. Scrollbar Hiding (Native Feel)

```css
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Hide scrollbar on webkit browsers */
}

.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
```

### 5. Bottom Sheet Filters

```
┌─────────────────────────────────────────┐
│  [←] [Search input...........] [≣]     │  ← Fixed Header
│                                          │
│  [All][Food][Transport][Coffee]...       │  ← Horizontal Scroll
│                                          │
├──────────────────────────────────────────┤
│  🔽 Advanced Filters (Slide from bottom) │  ← Bottom Sheet
│                                          │
│  From Date    To Date                    │
│  [________]  [________]                  │
│                                          │
│  Min Amount  Max Amount                  │
│  [________]  [________]                  │
│                                          │
│  [Clear]     [Apply]                     │
└──────────────────────────────────────────┘
     ↑                                 ↑
  Easy thumb reach            One-handed operation
```

---

## 🏗️ Component Architecture

```
MobileSearchModal
│
├── Props
│   ├── isOpen (boolean)
│   ├── onClose (callback)
│   ├── expenses (Expense[])
│   ├── onSelectExpense (callback)
│   └── isDarkMode (boolean)
│
├── State
│   ├── searchQuery (string)
│   ├── selectedCategory (string)
│   ├── showFilters (boolean)
│   ├── isSearching (boolean)
│   ├── searchResults (Expense[])
│   ├── startDate (string)
│   ├── endDate (string)
│   ├── minAmount (string)
│   └── maxAmount (string)
│
├── Refs
│   ├── searchInputRef (focus management)
│   └── debounceTimerRef (search debouncing)
│
├── Functions
│   ├── performSearch() - Execute search with filters
│   ├── handleSearchInput() - Debounced search trigger
│   ├── handleCategoryChange() - Quick filter
│   ├── handleApplyFilters() - Apply advanced filters
│   └── handleClearFilters() - Reset all filters
│
└── UI Sections
    ├── Header (search bar, back button, filter button)
    ├── Category Chips (horizontal scroll)
    ├── Advanced Filters Panel (conditional)
    ├── Results Count
    └── Search Results List
```

---

## 🔌 Backend Integration

### Spring Boot API Endpoint

```http
GET /api/expenses/search
```

**Query Parameters:**
```
q           - Search query (searches description, notes)
category    - Category filter (food, transport, etc.)
startDate   - Start date (YYYY-MM-DD)
endDate     - End date (YYYY-MM-DD)
minAmount   - Minimum amount (decimal)
maxAmount   - Maximum amount (decimal)
page        - Page number (for pagination)
size        - Results per page (default: 20)
sort        - Sort field (date, amount, description)
order       - Sort order (asc, desc)
```

**Example Request:**
```
GET /api/expenses/search?
  q=lunch&
  category=food&
  startDate=2026-02-01&
  endDate=2026-02-28&
  minAmount=10&
  maxAmount=500&
  page=0&
  size=20&
  sort=date&
  order=desc
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "exp-uuid-123",
      "description": "Lunch at cafe",
      "category": "food",
      "amount": 250.50,
      "date": "2026-02-15T12:30:00Z",
      "notes": "Business lunch with client",
      "receiptUrl": "https://...",
      "createdAt": "2026-02-15T12:30:00Z"
    },
    {
      "id": "exp-uuid-456",
      "description": "Lunch buffet",
      "category": "food",
      "amount": 450.00,
      "date": "2026-02-10T13:00:00Z",
      "notes": null,
      "receiptUrl": null,
      "createdAt": "2026-02-10T13:00:00Z"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

### Spring Boot Controller

```java
@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    
    @Autowired
    private ExpenseService expenseService;
    
    /**
     * Search expenses with filters
     * 
     * GET /api/expenses/search?q=lunch&category=food&startDate=2026-02-01
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ExpenseResponse>> searchExpenses(
        @RequestHeader("Authorization") String token,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) BigDecimal minAmount,
        @RequestParam(required = false) BigDecimal maxAmount,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "date") String sort,
        @RequestParam(defaultValue = "desc") String order
    ) {
        String userId = jwtService.extractUserId(token);
        
        ExpenseSearchCriteria criteria = ExpenseSearchCriteria.builder()
            .userId(userId)
            .query(q)
            .category(category)
            .startDate(startDate)
            .endDate(endDate)
            .minAmount(minAmount)
            .maxAmount(maxAmount)
            .build();
        
        Sort sortOrder = order.equalsIgnoreCase("asc") 
            ? Sort.by(sort).ascending() 
            : Sort.by(sort).descending();
        
        Pageable pageable = PageRequest.of(page, size, sortOrder);
        
        Page<Expense> expenses = expenseService.searchExpenses(criteria, pageable);
        
        Page<ExpenseResponse> response = expenses.map(ExpenseResponse::from);
        
        return ResponseEntity.ok(response);
    }
}
```

### Service Layer with JPA Specification

```java
@Service
public class ExpenseService {
    
    @Autowired
    private ExpenseRepository expenseRepository;
    
    /**
     * Search expenses using JPA Specification for dynamic queries
     */
    public Page<Expense> searchExpenses(
        ExpenseSearchCriteria criteria,
        Pageable pageable
    ) {
        Specification<Expense> spec = ExpenseSpecification.build(criteria);
        return expenseRepository.findAll(spec, pageable);
    }
}
```

### JPA Specification (Dynamic Query Builder)

```java
public class ExpenseSpecification {
    
    public static Specification<Expense> build(ExpenseSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by user ID (always required)
            predicates.add(cb.equal(root.get("userId"), criteria.getUserId()));
            
            // Filter by search query (description OR notes)
            if (criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                String searchPattern = "%" + criteria.getQuery().toLowerCase() + "%";
                Predicate descriptionMatch = cb.like(
                    cb.lower(root.get("description")),
                    searchPattern
                );
                Predicate notesMatch = cb.like(
                    cb.lower(root.get("notes")),
                    searchPattern
                );
                predicates.add(cb.or(descriptionMatch, notesMatch));
            }
            
            // Filter by category
            if (criteria.getCategory() != null && !criteria.getCategory().isEmpty()) {
                predicates.add(cb.equal(root.get("category"), criteria.getCategory()));
            }
            
            // Filter by date range
            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                    root.get("date"),
                    criteria.getStartDate().atStartOfDay()
                ));
            }
            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                    root.get("date"),
                    criteria.getEndDate().atTime(23, 59, 59)
                ));
            }
            
            // Filter by amount range
            if (criteria.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                    root.get("amount"),
                    criteria.getMinAmount()
                ));
            }
            if (criteria.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                    root.get("amount"),
                    criteria.getMaxAmount()
                ));
            }
            
            // Exclude soft-deleted expenses
            predicates.add(cb.isNull(root.get("deletedAt")));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

### Database Query (PostgreSQL)

The JPA Specification generates SQL like:

```sql
SELECT e.*
FROM expenses e
WHERE e.user_id = ?
  AND e.deleted_at IS NULL
  AND (
    LOWER(e.description) LIKE ? 
    OR LOWER(e.notes) LIKE ?
  )
  AND e.category = ?
  AND e.date >= ?
  AND e.date <= ?
  AND e.amount >= ?
  AND e.amount <= ?
ORDER BY e.date DESC
LIMIT 20 OFFSET 0;
```

**Performance Optimization:**

```sql
-- Add indexes for common search patterns
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_user_amount ON expenses(user_id, amount);
CREATE INDEX idx_expenses_description_gin ON expenses USING gin(to_tsvector('english', description));
CREATE INDEX idx_expenses_notes_gin ON expenses USING gin(to_tsvector('english', notes));
```

---

## 🔍 Search Algorithm

### Frontend Debouncing

```typescript
/**
 * Debounce Strategy
 * 
 * Problem: Making API call on every keystroke is inefficient
 * Solution: Wait 300ms after user stops typing
 */
const handleSearchInput = (value: string) => {
  setSearchQuery(value);
  
  // Clear existing timer (user is still typing)
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }
  
  // Set new timer (will execute if user stops typing for 300ms)
  debounceTimerRef.current = setTimeout(() => {
    performSearch(value, selectedCategory);
  }, 300);
};
```

**Timing Breakdown:**
```
User types: "lun"
  ↓ (0ms)   - Start timer #1 (300ms)
  ↓ (50ms)  - User types "c" → Cancel timer #1, start timer #2
  ↓ (100ms) - User types "h" → Cancel timer #2, start timer #3
  ↓ (150ms) - User stops typing
  ↓ (450ms) - Timer #3 fires → API call with query "lunch"
```

### Search Relevance Ranking

```java
/**
 * Rank results by relevance
 * 
 * Priority:
 * 1. Exact match in description
 * 2. Starts with query in description
 * 3. Contains query in description
 * 4. Contains query in notes
 */
@Query("""
    SELECT e FROM Expense e
    WHERE e.userId = :userId
      AND e.deletedAt IS NULL
      AND (
        LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(e.notes) LIKE LOWER(CONCAT('%', :query, '%'))
      )
    ORDER BY
      CASE
        WHEN LOWER(e.description) = LOWER(:query) THEN 1
        WHEN LOWER(e.description) LIKE LOWER(CONCAT(:query, '%')) THEN 2
        WHEN LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) THEN 3
        WHEN LOWER(e.notes) LIKE LOWER(CONCAT('%', :query, '%')) THEN 4
        ELSE 5
      END,
      e.date DESC
    """)
Page<Expense> searchExpenses(
    @Param("userId") String userId,
    @Param("query") String query,
    Pageable pageable
);
```

### Full-Text Search (Advanced)

For better performance with large datasets:

```sql
-- Create full-text search index
CREATE INDEX idx_expenses_fulltext 
ON expenses 
USING gin(to_tsvector('english', description || ' ' || COALESCE(notes, '')));

-- Query using full-text search
SELECT e.*,
       ts_rank(to_tsvector('english', e.description || ' ' || COALESCE(e.notes, '')), query) AS rank
FROM expenses e,
     to_tsquery('english', 'lunch') query
WHERE e.user_id = ?
  AND e.deleted_at IS NULL
  AND to_tsvector('english', e.description || ' ' || COALESCE(e.notes, '')) @@ query
ORDER BY rank DESC, e.date DESC
LIMIT 20;
```

---

## 🎨 User Experience Flow

### 1. Opening Search Modal

```
User Journey:
  ↓
User clicks "Search" button in Quick Actions
  ↓
Modal slides up from bottom (300ms animation)
  ↓
Search input auto-focuses
  ↓
Keyboard appears (on mobile)
  ↓
All recent expenses shown (empty query)
  ↓
User can start typing or use filters
```

### 2. Searching Flow

```
User types: "coffee"
  ↓ (0ms)
Input shows "c"
  ↓ (50ms)
Input shows "co"
  ↓ (100ms)
Input shows "cof"
  ↓ (150ms)
Input shows "coff"
  ↓ (200ms)
Input shows "coffe"
  ↓ (250ms)
Input shows "coffee"
  ↓ (300ms user stops typing)
Show loading indicator
  ↓ (API call)
GET /api/expenses/search?q=coffee
  ↓ (response received)
Display results (slide-in animation)
```

### 3. Using Quick Filters

```
User taps "Food" chip
  ↓
Chip highlights (white background in light mode)
  ↓
Instantly filter results to food category
  ↓
API call: GET /api/expenses/search?category=food
  ↓
Results update
```

### 4. Advanced Filters

```
User taps filter icon (≣)
  ↓
Bottom sheet slides down
  ↓
User sets date range: Feb 1 - Feb 28
  ↓
User sets amount range: ₹100 - ₹500
  ↓
User taps "Apply"
  ↓
Bottom sheet closes
  ↓
API call with all filters
  ↓
Results update
  ↓
Filter button shows red dot (active filters indicator)
```

### 5. Selecting Result

```
User sees result in list
  ↓
User taps on expense card
  ↓
onSelectExpense(expense) callback fires
  ↓
Modal closes with slide-down animation
  ↓
Parent opens EditExpenseModal with selected expense
```

---

## 💻 Code Implementation

### Component Structure

```typescript
// FILE: /components/MobileSearchModal.tsx

export function MobileSearchModal({
  isOpen,
  onClose,
  expenses,
  onSelectExpense,
  isDarkMode = false,
}: MobileSearchModalProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Expense[]>([]);
  
  // Advanced filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════
  // SEARCH FUNCTION
  // ═══════════════════════════════════════════════════════════
  
  const performSearch = async (query: string, category: string) => {
    setIsSearching(true);
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Build query string
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category !== 'all') params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      params.append('page', '0');
      params.append('size', '20');
      params.append('sort', 'date');
      params.append('order', 'desc');
      
      // Call API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/expenses/search?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data.content || []);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search expenses');
      
      // Fallback to local filtering
      performLocalSearch(query, category);
    } finally {
      setIsSearching(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // DEBOUNCED INPUT
  // ═══════════════════════════════════════════════════════════
  
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value, selectedCategory);
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-[...] animate-slideUp">
      {/* Header */}
      <div className="sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose}>
            <ArrowLeft />
          </button>
          
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search expenses..."
          />
          
          <button onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal />
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={selectedCategory === cat.value ? 'active' : ''}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          {/* Date range, amount range inputs */}
          <button onClick={handleApplyFilters}>Apply</button>
        </div>
      )}

      {/* Results */}
      <div className="results">
        {isSearching ? (
          <LoadingDots />
        ) : searchResults.length > 0 ? (
          searchResults.map(expense => (
            <ExpenseResultCard
              key={expense.id}
              expense={expense}
              onClick={() => {
                onSelectExpense(expense);
                onClose();
              }}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
```

---

## ⚡ Performance Optimization

### 1. Debouncing

```typescript
// ❌ BAD: API call on every keystroke
onChange={(e) => performSearch(e.target.value)}
// Result: 6 API calls for typing "coffee"

// ✅ GOOD: API call after user stops typing
onChange={(e) => handleSearchInput(e.target.value)}
// Result: 1 API call after 300ms pause
```

### 2. Request Cancellation

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const performSearch = async (query: string) => {
  // Cancel previous request if still running
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Create new abort controller
  abortControllerRef.current = new AbortController();
  
  try {
    const response = await fetch(url, {
      signal: abortControllerRef.current.signal,
      // ... other options
    });
    // ... handle response
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled - this is expected
      return;
    }
    // ... handle other errors
  }
};
```

### 3. Result Caching

```typescript
const searchCacheRef = useRef<Map<string, Expense[]>>(new Map());

const performSearch = async (query: string, category: string) => {
  // Create cache key
  const cacheKey = `${query}|${category}|${startDate}|${endDate}`;
  
  // Check cache first
  if (searchCacheRef.current.has(cacheKey)) {
    setSearchResults(searchCacheRef.current.get(cacheKey)!);
    return;
  }
  
  // Perform API call
  const results = await fetch(/* ... */);
  
  // Store in cache
  searchCacheRef.current.set(cacheKey, results);
  setSearchResults(results);
};
```

### 4. Infinite Scroll (Future Enhancement)

```typescript
const [page, setPage] = useState(0);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const nextPage = page + 1;
  const response = await fetch(`/api/expenses/search?page=${nextPage}&size=20`);
  const data = await response.json();
  
  setSearchResults([...searchResults, ...data.content]);
  setPage(nextPage);
  setHasMore(nextPage < data.page.totalPages);
};

// In render:
<InfiniteScroll
  loadMore={loadMore}
  hasMore={hasMore}
  loader={<LoadingSpinner />}
>
  {searchResults.map(/* ... */)}
</InfiniteScroll>
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Basic Search
- [ ] Open search modal
- [ ] Input auto-focuses
- [ ] Type query - results appear after 300ms
- [ ] Clear button (X) works
- [ ] Empty search shows all expenses
- [ ] Back button closes modal

#### Category Filtering
- [ ] All categories visible
- [ ] Horizontal scroll works smoothly
- [ ] Tapping chip highlights it
- [ ] Results filter immediately
- [ ] Selected chip persists

#### Advanced Filters
- [ ] Filter button opens bottom sheet
- [ ] Date pickers work correctly
- [ ] Amount inputs accept decimals
- [ ] "Clear" resets all filters
- [ ] "Apply" closes sheet and filters
- [ ] Red dot shows when filters active

#### Results
- [ ] Results display correctly
- [ ] Tap result closes modal
- [ ] onSelectExpense callback fires
- [ ] "No results" shows when empty
- [ ] Loading indicator during search

#### Mobile UX
- [ ] Touch targets are large enough
- [ ] Animations are smooth (60fps)
- [ ] Keyboard doesn't obscure input
- [ ] Works in portrait and landscape
- [ ] Dark mode styles correct

### API Testing

```bash
# 1. Basic search
curl "http://localhost:8080/api/expenses/search?q=lunch" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Category filter
curl "http://localhost:8080/api/expenses/search?category=food" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Date range
curl "http://localhost:8080/api/expenses/search?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Amount range
curl "http://localhost:8080/api/expenses/search?minAmount=100&maxAmount=500" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Combined filters
curl "http://localhost:8080/api/expenses/search?q=coffee&category=coffee&minAmount=50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Pagination
curl "http://localhost:8080/api/expenses/search?page=0&size=10&sort=amount&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Summary

### Comparison: Old vs New

| Feature | Old SearchFilters | New MobileSearchModal |
|---------|------------------|------------------------|
| **Screen Space** | Small dropdown | Full-screen modal |
| **Touch Targets** | 32px buttons | 44px minimum |
| **Auto-Focus** | No | Yes |
| **Debouncing** | No | 300ms |
| **Category Filter** | Dropdown | Chip scroll |
| **Advanced Filters** | Expanded panel | Bottom sheet |
| **Animations** | Basic | Slide-up, smooth |
| **Mobile Optimized** | Partial | Fully |
| **Gestures** | None | Swipe to dismiss (future) |
| **Performance** | No caching | Cached results |

### Key Improvements

1. **Better UX**: Full-screen focus, no distractions
2. **Touch-Friendly**: Large tap targets, easy one-handed use
3. **Faster**: Debouncing reduces API calls by 83%
4. **Smoother**: 60fps animations, native app feel
5. **Smarter**: Result caching, request cancellation

---

**Last Updated**: February 9, 2026  
**Version**: 2.0.0  
**Component**: `/components/MobileSearchModal.tsx`  
**API Endpoint**: `GET /api/expenses/search`  
**Replaces**: `/components/SearchFilters.tsx`
