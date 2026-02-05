/**
 * TOAST NOTIFICATION UTILITY
 * 
 * Simple toast notification system using Sonner library.
 * Provides user feedback for actions, errors, and success messages.
 * 
 * FEATURES:
 * - Success, error, warning, info variants
 * - Auto-dismiss with configurable duration
 * - Action buttons
 * - Promise-based loading toasts
 * - Accessible (ARIA live regions)
 * - Keyboard dismissible
 * - Stacking support
 * 
 * USAGE:
 * import { toast } from './utils/toast';
 * 
 * // Simple success
 * toast.success('Expense added!');
 * 
 * // Error with description
 * toast.error('Failed to save', 'Please check your internet connection');
 * 
 * // With action button
 * toast.success('Expense deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => restoreExpense(),
 *   },
 * });
 * 
 * // Promise-based
 * toast.promise(
 *   saveExpense(),
 *   {
 *     loading: 'Saving...',
 *     success: 'Saved!',
 *     error: 'Failed to save',
 *   }
 * );
 * 
 * INSTALLATION:
 * npm install sonner
 * 
 * Then add <Toaster /> to your root component (App.tsx)
 */

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner@2.0.3';

// ================================
// TYPE DEFINITIONS
// ================================

interface ToastOptions {
  description?: string;
  duration?: number; // milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

interface PromiseToastOptions {
  loading: string;
  success: string | ((data: any) => string);
  error: string | ((error: any) => string);
  duration?: number;
}

// ================================
// TOAST WRAPPER FUNCTIONS
// ================================

/**
 * Show success toast
 * 
 * @param message - Main message
 * @param options - Additional options
 * 
 * @example
 * toast.success('Expense added successfully!');
 * toast.success('Saved!', { description: 'Your changes have been saved.' });
 */
function success(message: string, options?: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return sonnerToast.success(message, {
    description: opts?.description,
    duration: opts?.duration || 4000,
    action: opts?.action,
    cancel: opts?.cancel,
  });
}

/**
 * Show error toast
 * 
 * @param message - Main message
 * @param options - Additional options
 * 
 * @example
 * toast.error('Failed to save expense');
 * toast.error('Error', { description: 'Please check your internet connection' });
 */
function error(message: string, options?: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return sonnerToast.error(message, {
    description: opts?.description,
    duration: opts?.duration || 5000, // Errors stay longer
    action: opts?.action,
    cancel: opts?.cancel,
  });
}

/**
 * Show warning toast
 * 
 * @param message - Main message
 * @param options - Additional options
 * 
 * @example
 * toast.warning('Budget limit approaching');
 */
function warning(message: string, options?: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return sonnerToast.warning(message, {
    description: opts?.description,
    duration: opts?.duration || 4000,
    action: opts?.action,
    cancel: opts?.cancel,
  });
}

/**
 * Show info toast
 * 
 * @param message - Main message
 * @param options - Additional options
 * 
 * @example
 * toast.info('New feature available!');
 */
function info(message: string, options?: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return sonnerToast.info(message, {
    description: opts?.description,
    duration: opts?.duration || 4000,
    action: opts?.action,
    cancel: opts?.cancel,
  });
}

/**
 * Show loading toast
 * Returns toast ID to update or dismiss later
 * 
 * @param message - Loading message
 * 
 * @example
 * const toastId = toast.loading('Saving expense...');
 * // Later:
 * toast.success('Saved!'); // Auto-dismisses loading toast
 */
function loading(message: string) {
  return sonnerToast.loading(message);
}

/**
 * Promise-based toast
 * Automatically shows loading, success, or error states
 * 
 * @param promise - Promise to track
 * @param messages - Messages for each state
 * 
 * @example
 * toast.promise(
 *   saveExpense(data),
 *   {
 *     loading: 'Saving expense...',
 *     success: 'Expense saved successfully!',
 *     error: 'Failed to save expense',
 *   }
 * );
 * 
 * // With dynamic messages
 * toast.promise(
 *   fetchData(),
 *   {
 *     loading: 'Loading...',
 *     success: (data) => `Loaded ${data.length} items`,
 *     error: (err) => `Error: ${err.message}`,
 *   }
 * );
 */
function promise<T>(promise: Promise<T>, messages: PromiseToastOptions) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    duration: messages.duration,
  });
}

/**
 * Dismiss a specific toast
 * 
 * @param toastId - Toast ID to dismiss
 */
function dismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Custom toast with full control
 * 
 * @param message - Message to display
 * @param options - Full options object
 */
function custom(message: string, options?: any) {
  return sonnerToast(message, options);
}

// ================================
// EXPORT TOAST API
// ================================

export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  dismiss,
  custom,
};

// ================================
// TOASTER COMPONENT
// ================================

/**
 * Toaster component to render toasts
 * Add this once to your root component (App.tsx)
 * 
 * @example
 * import { Toaster } from './utils/toast';
 * 
 * function App() {
 *   return (
 *     <>
 *       <Toaster />
 *       <YourApp />
 *     </>
 *   );
 * }
 */
export function Toaster({
  isDarkMode = false,
  position = 'top-center',
}: {
  isDarkMode?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}) {
  return (
    <SonnerToaster
      position={position}
      theme={isDarkMode ? 'dark' : 'light'}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: isDarkMode ? '#1c1c1e' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          fontSize: '15px',
          fontWeight: '500',
        },
      }}
    />
  );
}

// ================================
// PRESET TOAST MESSAGES
// ================================

/**
 * Common preset toast messages for the app
 * Ensures consistent messaging across the application
 */
export const toastMessages = {
  // Expense messages
  expenseAdded: () => toast.success('Expense added!', 'Your expense has been recorded'),
  expenseUpdated: () => toast.success('Expense updated!', 'Changes have been saved'),
  expenseDeleted: (onUndo?: () => void) =>
    toast.success('Expense deleted', {
      action: onUndo
        ? {
            label: 'Undo',
            onClick: onUndo,
          }
        : undefined,
    }),

  // Budget messages
  budgetSet: (amount: number) =>
    toast.success('Budget set!', `Monthly budget: ₹${amount.toFixed(2)}`),
  budgetWarning: (percentage: number) =>
    toast.warning('Budget Alert', `You've used ${percentage}% of your monthly budget`),
  budgetExceeded: () =>
    toast.error('Budget Exceeded!', 'You have exceeded your monthly budget limit'),

  // Savings goals
  goalCreated: () => toast.success('Goal created!', 'Start saving towards your goal'),
  goalUpdated: () => toast.success('Progress updated!', 'Keep up the good work'),
  goalCompleted: () => toast.success('🎉 Goal completed!', 'Congratulations on reaching your goal'),

  // Auth messages
  loginSuccess: (name: string) => toast.success(`Welcome back, ${name}!`),
  logoutSuccess: () => toast.success('Logged out successfully'),
  loginError: () => toast.error('Login failed', 'Please check your credentials'),
  registerSuccess: () => toast.success('Account created!', 'Welcome to Kakeibo'),

  // Sync messages
  syncSuccess: () => toast.success('Synced!', 'Your data has been synchronized'),
  syncError: () =>
    toast.error('Sync failed', 'Changes are saved locally and will sync when online'),
  offlineMode: () => toast.info('Offline mode', 'Working offline - changes will sync later'),

  // Export messages
  exportSuccess: () => toast.success('Export complete!', 'Your file is ready'),
  exportError: () => toast.error('Export failed', 'Please try again'),

  // Validation errors
  invalidAmount: () => toast.error('Invalid amount', 'Please enter a valid number'),
  invalidDate: () => toast.error('Invalid date', 'Please select a valid date'),
  requiredField: (field: string) => toast.error(`${field} is required`),

  // Network errors
  networkError: () =>
    toast.error('Network error', 'Please check your internet connection'),
  serverError: () =>
    toast.error('Server error', 'Something went wrong. Please try again later'),

  // Generic messages
  somethingWentWrong: () => toast.error('Something went wrong', 'Please try again'),
  changesSaved: () => toast.success('Changes saved!'),
  actionCancelled: () => toast.info('Action cancelled'),
};

export default toast;
