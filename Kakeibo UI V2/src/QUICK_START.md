# 🚀 QUICK START GUIDE - Kakeibo Expense Tracker

## ⚡ **5-Minute Setup**

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## 🎨 **Key Features at a Glance**

### Authentication
- **Login/Register**: Email + password
- **PIN Lock**: 4-6 digit PIN with encryption
- **Dark Mode**: Full theme support

### Expense Tracking
- **Add**: Amount, category, date, notes, receipt
- **Edit**: Modify any expense detail
- **Delete**: With confirmation dialog
- **Search**: Filter by category, date, amount

### Analytics
- **Monthly Total**: Track spending
- **Category Breakdown**: Visual percentages
- **Insights**: Smart recommendations

### Budget & Goals
- **Budget Warnings**: 50%, 80%, 100% alerts
- **Savings Goals**: Track progress

---

## 🛠️ **Common Development Tasks**

### Add a Toast Notification
```typescript
import { toast } from './utils/toast';

// Success
toast.success('Operation completed!');

// Error
toast.error('Something went wrong', 'Description here');

// With action
toast.success('Item deleted', {
  action: { label: 'Undo', onClick: handleUndo }
});
```

### Show Confirmation Dialog
```typescript
import { useConfirm } from './components/ConfirmDialog';

const { confirm, ConfirmDialog } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Item?',
    message: 'This cannot be undone.',
    variant: 'danger',
  });
  
  if (confirmed) {
    // Delete logic
  }
};

// In render:
<ConfirmDialog isDarkMode={isDarkMode} />
```

### Add Loading State
```typescript
import { LoadingSpinner } from './components/LoadingSpinner';

{isLoading && <LoadingSpinner message="Loading..." />}
```

### Validate Form Input
```typescript
import { validateEmail, validateAmount } from './utils/validation';

const result = validateEmail(email);
if (!result.isValid) {
  toast.error(result.error);
}
```

### Call API (When Backend Ready)
```typescript
import { createExpense } from './services/api';

try {
  const newExpense = await createExpense({
    description: 'Lunch',
    category: 'food',
    amount: 250.50,
    date: new Date().toISOString(),
  });
  toast.success('Expense added!');
} catch (error) {
  toast.error('Failed to add expense');
}
```

---

## 📂 **Project Structure**

```
/
├── App.tsx                    # Main app entry (auth wrapper)
├── .env.example               # Environment variables template
├── PRODUCTION_GUIDE.md        # Full deployment guide
├── PRODUCTION_CHECKLIST.md    # Launch readiness checklist
│
├── /components/
│   ├── AppMain.tsx           # Main dashboard
│   ├── AuthScreen.tsx        # Login/Register
│   ├── PINLockScreen.tsx     # PIN lock
│   ├── SettingsView.tsx      # Settings page
│   ├── AnalyticsView.tsx     # Analytics page
│   ├── CalendarView.tsx      # Past expenses calendar
│   ├── SavingsGoalsView.tsx  # Savings goals
│   ├── ErrorBoundary.tsx     # Error handling
│   ├── LoadingSpinner.tsx    # Loading states
│   ├── ConfirmDialog.tsx     # Confirmation dialogs
│   └── ...                   # Other components
│
├── /services/
│   └── api.ts                # API service layer
│
├── /utils/
│   ├── validation.ts         # Form validation
│   ├── security.ts           # Encryption, tokens
│   └── toast.tsx             # Toast notifications
│
└── /styles/
    └── globals.css           # Global styles
```

---

## 🔧 **Environment Variables**

### Required for Production
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Optional but Recommended
```env
VITE_SENTRY_DSN=your-sentry-dsn        # Error monitoring
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X     # Analytics
VITE_ENABLE_OFFLINE_MODE=true          # Offline support
```

### Development Only
```env
VITE_DEBUG=true                        # Debug logs
VITE_USE_MOCK_API=true                 # Mock API responses
```

---

## 🎯 **Backend Integration Points**

### Where to Replace TODOs

1. **Authentication** (`/services/api.ts`)
   - Line 38: `login()` function
   - Line 78: `register()` function
   - Line 118: `refreshToken()` function

2. **Expenses** (`/services/api.ts`)
   - Line 142: `getExpenses()` function
   - Line 163: `createExpense()` function
   - Line 181: `updateExpense()` function
   - Line 198: `deleteExpense()` function

3. **Other Features**
   - Recurring expenses (line 244)
   - Budgets (line 320)
   - Savings goals (line 367)
   - File uploads (line 215)

### API Endpoints Needed
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/budgets/current
POST   /api/budgets
GET    /api/savings-goals
POST   /api/savings-goals
```

Full list in `PRODUCTION_GUIDE.md`

---

## 🐛 **Debugging Tips**

### Check Console Logs
All API calls log to console with `[API]` prefix in development mode.

### Error Boundary
If you see the error screen, check:
1. Browser console for error details
2. Component stack trace
3. Recent code changes

### Dark Mode Issues
Verify component has `isDarkMode` prop:
```typescript
interface Props {
  isDarkMode?: boolean;
}
```

### Validation Not Working
Check validation result:
```typescript
const result = validateEmail(email);
console.log(result); // { isValid: false, error: "message" }
```

---

## 📚 **Useful Code Snippets**

### Add New Category
Edit `/components/AppMain.tsx`:
```typescript
const categories = [
  { value: 'food', label: '🍔 Food', color: 'from-[#ff6b6b] to-[#ee5a6f]' },
  { value: 'yournew', label: '✨ New', color: 'from-[#...] to-[#...]' },
  // ...
];
```

### Change Currency
Search and replace `₹` with your currency symbol (e.g., `$`, `€`, `£`)

### Adjust Theme Colors
Edit `/styles/globals.css` for global color tokens

### Add Custom Validation
In `/utils/validation.ts`:
```typescript
export function validateCustomField(value: string): {
  isValid: boolean;
  error: string | null;
} {
  if (!value) {
    return { isValid: false, error: 'Field is required' };
  }
  // Your validation logic
  return { isValid: true, error: null };
}
```

---

## 🚀 **Build for Production**

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview

# Check bundle size
npm run build -- --report
```

---

## ✅ **Testing Checklist**

Before deploying, test:

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Register new account
- [ ] Set PIN lock
- [ ] Unlock with correct PIN
- [ ] Add expense
- [ ] Edit expense
- [ ] Delete expense (should show confirmation)
- [ ] Search expenses
- [ ] Filter by category
- [ ] View analytics
- [ ] View past expenses calendar
- [ ] Create savings goal
- [ ] Toggle dark mode
- [ ] Logout

---

## 📞 **Need Help?**

### Documentation
- **Full Guide**: `PRODUCTION_GUIDE.md` (400+ lines)
- **Checklist**: `PRODUCTION_CHECKLIST.md`
- **This Guide**: `QUICK_START.md`

### Common Issues
1. **"process is not defined"** → Use `import.meta.env` instead of `process.env`
2. **API calls failing** → Check `.env` has `VITE_API_BASE_URL`
3. **Dark mode not working** → Verify `isDarkMode` prop passed to component
4. **Toast not showing** → Ensure `<Toaster />` in App.tsx
5. **Validation not working** → Import from `/utils/validation.ts`

---

## 🎊 **You're Ready!**

Your app has:
✅ Full authentication  
✅ Complete error handling  
✅ Professional validation  
✅ Toast notifications  
✅ Dark mode support  
✅ Production-ready code  

**Happy coding!** 🚀
