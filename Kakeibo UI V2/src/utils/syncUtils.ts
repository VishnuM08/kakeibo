/**
 * Offline-First Data Sync Utilities
 *
 * ARCHITECTURE:
 * 1. All data operations happen on localStorage first (instant)
 * 2. Changes are queued for sync when online
 * 3. Background sync happens automatically when connection restored
 * 4. Conflict resolution: Last-write-wins or server preference
 *
 * BACKEND INTEGRATION:
 * - Sync queue processed via POST /api/sync/batch
 * - Pull latest data via GET /api/sync/pull?lastSyncTime=timestamp
 * - Push changes via POST /api/sync/push
 */

import api, {
  updateExpense,
  SavingsGoal,
  RecurringExpense,
  Budget,
} from "../services/api";
import { UIExpense } from "../types/UIExpense";

// ==================== SYNC QUEUE ====================

export interface SyncOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: "expense" | "budget" | "savings_goal" | "recurring_expense";
  data: any;
  timestamp: number;
  synced: boolean;
}

/**
 * Add operation to sync queue
 * Operations will be synced to backend when online
 */
export function queueSyncOperation(
  operation: Omit<SyncOperation, "id" | "timestamp" | "synced">,
): void {
  const syncQueue = getSyncQueue();

  const newOperation: SyncOperation = {
    ...operation,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    synced: false,
  };

  syncQueue.push(newOperation);
  localStorage.setItem("kakeibo_sync_queue", JSON.stringify(syncQueue));

  console.log("[SYNC] Operation queued:", newOperation);
}

/**
 * Get all pending sync operations
 */
export function getSyncQueue(): SyncOperation[] {
  const stored = localStorage.getItem("kakeibo_sync_queue");
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear synced operations from queue
 */
export function clearSyncedOperations(): void {
  const syncQueue = getSyncQueue();
  const pending = syncQueue.filter((op) => !op.synced);
  localStorage.setItem("kakeibo_sync_queue", JSON.stringify(pending));
}

// ==================== ONLINE/OFFLINE DETECTION ====================

let isOnline = navigator.onLine;
let syncInProgress = false;

/**
 * Initialize sync listeners
 * Call this once on app startup
 */
export function initializeSyncListeners(onSyncComplete?: () => void): void {
  // Listen for online/offline events
  window.addEventListener("online", async () => {
    console.log("[SYNC] Connection restored, starting sync...");
    isOnline = true;
    await syncWithBackend();
    onSyncComplete?.();
  });

  window.addEventListener("offline", () => {
    console.log("[SYNC] Connection lost, working offline...");
    isOnline = false;
  });

  // Initial sync if online
  if (isOnline && !syncInProgress) {
    syncWithBackend().then(onSyncComplete);
  }

  // Periodic sync every 5 minutes
  setInterval(
    () => {
      if (isOnline && !syncInProgress) {
        syncWithBackend().then(onSyncComplete);
      }
    },
    5 * 60 * 1000,
  );
}

/**
 * Get current online status
 */
export function getOnlineStatus(): boolean {
  return isOnline;
}

// ==================== SYNC WITH BACKEND ====================

/**
 * Sync all pending changes with backend
 *
 * TODO: BACKEND INTEGRATION
 * - POST /api/sync/push with sync queue
 * - GET /api/sync/pull?lastSyncTime=timestamp
 * - Merge remote changes with local data
 */
export async function syncWithBackend(): Promise<void> {
  if (syncInProgress) {
    console.log("[SYNC] Sync already in progress, skipping...");
    return;
  }

  if (!isOnline) {
    console.log("[SYNC] Offline, cannot sync");
    return;
  }

  syncInProgress = true;

  try {
    console.log("[SYNC] Starting sync with backend...");

    const syncQueue = getSyncQueue();
    const pendingOps = syncQueue.filter((op) => !op.synced);

    if (pendingOps.length === 0) {
      console.log("[SYNC] No pending operations");
      syncInProgress = false;
      return;
    }

    // TODO: BACKEND INTEGRATION - Send to API
    // const response = await fetch('/api/sync/push', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
    //   },
    //   body: JSON.stringify({ operations: pendingOps })
    // });
    //
    // if (!response.ok) {
    //   throw new Error('Sync failed');
    // }

    console.log(
      "[SYNC] Pushing",
      pendingOps.length,
      "operations to backend...",
    );

    for (const op of pendingOps) {
      try {
        if (op.entity === "expense") {
          if (op.type === "UPDATE") {
            const updates: any = {
              description: op.data.description,
              category: op.data.category,
              amount: op.data.amount,
              expenseDateTime:
                op.data.expenseDateTime || op.data.dateTime || op.data.date,
              notes: op.data.notes,
              receiptUrl: op.data.receiptUrl,
            };

            console.log("[SYNC] updateExpense request", op.data.id, {
              updates,
              tokenPresent: !!localStorage.getItem("jwt_token"),
            });

            await updateExpense(op.data.id, updates);
            op.synced = true;
          } else if (op.type === "CREATE") {
            await api.post("/expenses", {
              description: op.data.description,
              category: op.data.category,
              amount: op.data.amount,
              expenseDateTime: op.data.expenseDateTime || op.data.date,
              notes: op.data.notes,
              receiptUrl: op.data.receiptUrl,
            });
            op.synced = true;
          } else if (op.type === "DELETE") {
            await api.delete(`/expenses/${op.data.id}`);
            op.synced = true;
          }
        } else {
          // TODO: handle budget, savings_goal, recurring_expense entities
          console.warn("[SYNC] Unsupported entity in sync queue:", op.entity);
        }
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 403 || status === 404) {
          // 403 Forbidden (no permission / not owner) or 404 Not Found
          // Mark as synced to remove from queue; fixing requires backend/permission review
          console.warn(
            `[SYNC] ${status} on op ${op.id} (${op.type} ${op.entity} ${op.data.id}). ` +
              `Check ownership/permissions on backend.`,
          );
          op.synced = true;
        } else {
          // Transient errors (5xx, network, etc.): retry next sync cycle
          console.error("[SYNC] Failed to process op", op.id, err);
        }
      }
    }

    // Persist updated sync queue and clear synced ops
    localStorage.setItem("kakeibo_sync_queue", JSON.stringify(syncQueue));
    clearSyncedOperations();

    // Pull latest data if needed
    // await pullLatestData();

    console.log("[SYNC] Sync completed successfully");
  } catch (error) {
    console.error("[SYNC] Sync failed:", error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Pull latest data from backend
 *
 * TODO: BACKEND INTEGRATION
 * - GET /api/sync/pull?lastSyncTime=timestamp
 * - Merge with local data using conflict resolution
 */
async function pullLatestData(): Promise<void> {
  const lastSyncTime = localStorage.getItem("kakeibo_last_sync_time") || "0";

  // TODO: BACKEND INTEGRATION
  // const response = await fetch(`/api/sync/pull?lastSyncTime=${lastSyncTime}`, {
  //   headers: {
  //     'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
  //   }
  // });
  //
  // const data = await response.json();
  // mergeRemoteData(data);

  // Update last sync time
  localStorage.setItem("kakeibo_last_sync_time", Date.now().toString());
}

/**
 * Merge remote data with local data
 * Conflict resolution: Server data wins for now
 */
function mergeRemoteData(remoteData: any): void {
  // TODO: Implement smart merge logic
  // For now, server data overwrites local

  if (remoteData.expenses) {
    localStorage.setItem(
      "kakeibo_expenses",
      JSON.stringify(remoteData.expenses),
    );
  }

  if (remoteData.budgets) {
    const currentBudget = remoteData.budgets.find((b: Budget) => {
      const month = new Date().toISOString().slice(0, 7);
      return b.month === month;
    });
    if (currentBudget) {
      localStorage.setItem(
        "kakeibo_monthly_budget",
        currentBudget.monthlyAmount.toString(),
      );
    }
  }

  if (remoteData.savingsGoals) {
    localStorage.setItem(
      "kakeibo_savings_goals",
      JSON.stringify(remoteData.savingsGoals),
    );
  }

  if (remoteData.recurringExpenses) {
    localStorage.setItem(
      "kakeibo_recurring_expenses",
      JSON.stringify(remoteData.recurringExpenses),
    );
  }

  console.log("[SYNC] Remote data merged with local data");
}

// ==================== LOCAL STORAGE HELPERS ====================

/**
 * Save expense to localStorage and queue for sync
 */
export function saveExpenseLocally(expense: UIExpense) {
  const expenses = getExpensesLocally();
  localStorage.setItem(
    "kakeibo_expenses",
    JSON.stringify([expense, ...expenses]),
  );

  // ❗ ONLY offline
  if (!navigator.onLine) {
    queueSyncOperation({
      type: "CREATE",
      entity: "expense",
      data: expense,
    });
  }
}

/**
 * Update expense in localStorage and queue for sync
 */
export function updateExpenseLocally(expense: UIExpense): void {
  const expenses = JSON.parse(localStorage.getItem("kakeibo_expenses") || "[]");
  const index = expenses.findIndex((e: UIExpense) => e.id === expense.id);

  if (index !== -1) {
    expenses[index] = expense;
    localStorage.setItem("kakeibo_expenses", JSON.stringify(expenses));

    queueSyncOperation({
      type: "UPDATE",
      entity: "expense",
      data: expense,
    });
  }
}

/**
 * Delete expense from localStorage and queue for sync
 */
export function deleteExpenseLocally(expenseId: string): void {
  const expenses = JSON.parse(localStorage.getItem("kakeibo_expenses") || "[]");
  const filtered = expenses.filter((e: UIExpense) => e.id !== expenseId);
  localStorage.setItem("kakeibo_expenses", JSON.stringify(filtered));

  queueSyncOperation({
    type: "DELETE",
    entity: "expense",
    data: { id: expenseId },
  });
}

/**
 * Get all expenses from localStorage
 */
export function getExpensesLocally(): UIExpense[] {
  const stored = localStorage.getItem("kakeibo_expenses");
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save budget to localStorage and queue for sync
 */
export function saveBudgetLocally(amount: number, month: string): void {
  localStorage.setItem("kakeibo_monthly_budget", amount.toString());

  queueSyncOperation({
    type: "CREATE",
    entity: "budget",
    data: { monthlyAmount: amount, month },
  });
}

/**
 * Get budget from localStorage
 */
export function getBudgetLocally(): number | null {
  const stored = localStorage.getItem("kakeibo_monthly_budget");
  return stored ? parseFloat(stored) : null;
}

/**
 * Force manual sync
 * Call this when user explicitly wants to sync
 */
export async function forceSync(): Promise<void> {
  if (!isOnline) {
    throw new Error("Cannot sync while offline");
  }

  await syncWithBackend();
}

/**
 * Get sync status info
 */
export function getSyncStatus(): {
  isOnline: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
} {
  const syncQueue = getSyncQueue();
  const pendingOps = syncQueue.filter((op) => !op.synced);
  const lastSyncTime = localStorage.getItem("kakeibo_last_sync_time");

  return {
    isOnline,
    pendingOperations: pendingOps.length,
    lastSyncTime: lastSyncTime
      ? new Date(parseInt(lastSyncTime)).toLocaleString()
      : null,
  };
}
