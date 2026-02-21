# 📚 Kakeibo UI V2: Comprehensive Codebase Guide

This document provides a deep dive into the logic, architecture, and configuration of the Kakeibo Expense Tracker.

---

## 🏗️ Technical Architecture

Kakeibo is built as a **Hybrid Mobile App** using:

- **Frontend**: React 18 with TypeScript.
- **Mobile Bridge**: [Capacitor](https://capacitorjs.com/) (to run as a native Android/iOS app).
- **Styling**: Tailwind CSS v4 + Framer Motion for premium animations.
- **Backend**: Spring Boot API (Production: `https://api.kakeibo.theaignite.app`).

### High-Level Data Flow

- **UI (React)** → **Hooks/Callbacks** → **Axios (API Service)** → **Capacitor Bridge** → **Spring Boot Server**.
- **Offline Storage**: Capacitor Preferences (persistent even if app is closed).

---

## 🔐 Authentication Logic

The authentication system is a **state machine** managed in `App.tsx`.

### 1. Persistence

We use `@capacitor/preferences` instead of `localStorage`.

- **Reason**: `localStorage` can be unstable on mobile. Preferences are specifically designed for native persistence.

### 2. Startup Lifecycle (`App.tsx`)

The app's initialization logic ensures that the user's session is valid before showing the dashboard:

```typescript
// Logic in App.tsx
useEffect(() => {
  (async () => {
    const token = await getAuthToken(); // 1. Retrieve async token from Preferences
    if (!token) return; // 2. No token? Stop here, AuthScreen is shown by default

    try {
      const user = await getMe(); // 3. Verify token with backend
      setUser(user);
      setIsAuthenticated(true); // 4. Success -> Show AppMain or PIN screen

      const { value: pinEnabled } = await Preferences.get({
        key: "kakeibo_pin_enabled",
      });
      if (pinEnabled === "true") {
        setIsPINEnabled(true);
        setIsUnlocked(false); // 5. Force PIN screen if enabled
      } else {
        setIsUnlocked(true);
      }
    } catch (error) {
      // 6. FAILURE (e.g., 401 Unauthorized) -> Clear everything and redirect
      await removeAuthToken();
      setIsAuthenticated(false);
      setUser(null);
    }
  })();
}, []);
```

### 3. Login Flow (`AuthScreen.tsx`)

When a user logs in:

1.  Calls `login()` API.
2.  Stores token via `setAuthToken(response.token)` (which uses `Preferences`).
3.  Triggers `onAuthSuccess()` which updates state in `App.tsx`, triggering a re-render to the dashboard.

---

## 🌐 Network & Configuration

### 1. API Base URL (`api.ts`)

To handle different environments, we use conditional logic:

```typescript
const isNative = Capacitor.isNativePlatform();
const baseURL = isNative ? "https://api.kakeibo.theaignite.app" : "/api";
```

- **Mobile Devices**: Use the full URL directly.
- **Browser (Localhost)**: Uses `/api`, which is a **Proxy** defined in `vite.config.ts`. This bypasses **CORS** security issues during development.

### 2. Timeout & Interceptors

- Requests timeout after **10 seconds** to prevent the app from hanging on slow connections.
- An **Interceptor** automatically adds the `Authorization: Bearer <token>` header to every outgoing request if a token is present in storage.

---

## 📴 Offline-First Strategy

Kakeibo is designed to work perfectly without an internet connection.

### 1. Optimistic Updates (`AppMain.tsx`)

When you add an expense:

1.  Create a "temporary" UI object with a unique `temp-ID`.
2.  Update React state immediately using `setExpenses([newExp, ...prev])`.
3.  In the background, check `navigator.onLine`.
    - **Online**: Send to backend and update the temporary ID with the real database ID.
    - **Offline**: Save to `localStorage` and queue for later.

### 2. Sync Queue Logic (`syncUtils.ts`)

The `SyncOperation` interface tracks what needs to be uploaded:

```typescript
export interface SyncOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: "expense" | "budget" | ...;
  data: any;
  synced: boolean;
}
```

**How Sync Works:**

1.  `queueSyncOperation()` adds the change to a list in storage.
2.  `window.addEventListener("online", ...)` listens for the internet to return.
3.  When online, `syncWithBackend()` loops through the queue:
    - It identifies the entity (`expense`).
    - It calls the appropriate API (`updateExpense`, etc.).
    - It marks the operation as `synced: true` only after a successful 200 OK response.
4.  Finally, `clearSyncedOperations()` removes completed tasks from the queue.

---

## 🎯 Component Logic & Communication

### 1. Parent-Child Pattern

Kakeibo uses the **"Data Down, Events Up"** pattern.

- **Data Down**: `AppMain` passes the `expenses` array to any child that needs it.
- **Events Up**: `AddExpenseModal` doesn't save data itself. It gathers user input and calls `onAdd(formData)`, which is a function provided by `AppMain`.

### 2. Budget Calculation Logic

Budget is calculated "on-the-fly" to ensure accuracy:

```typescript
const monthTotal = expenses
  .filter((exp) => {
    const expDate = new Date(exp.date);
    return (
      expDate.getMonth() === currentMonth &&
      expDate.getFullYear() === currentYear
    );
  })
  .reduce((sum, exp) => sum + exp.amount, 0);
```

- This filtered sum is then compared against `monthlyBudget` to calculate the percentage for the progress bar.

---

## 🛠️ Developer Workflow

### Syncing to Phone

1.  **Change Code**: Edit `.tsx` or `.ts` files.
2.  **Build**: `npm run build` (converts TS to JS).
3.  **Sync**: `npx cap sync android` (copies the JS/Build folder into the Android Studio project).
4.  **Run**: Click play in Android Studio.

---

## 📝 Directory Guide

- `src/App.tsx`: Main routing and authentication entry point.
- `src/services/api.ts`: All network communication logic.
- `src/utils/syncUtils.ts`: Offline database management and background sync.
- `src/components/AppMain.tsx`: The primary logic hub for the entire application.
